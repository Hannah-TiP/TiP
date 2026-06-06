import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInfiniteList } from '@/lib/use-infinite-list';
import type { PaginatedResult } from '@/types/common';

// jsdom has no IntersectionObserver; capture the callback so tests can drive
// the sentinel intersection manually.
let observerCallback: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
const observeMock = vi.fn();
const disconnectMock = vi.fn();

beforeEach(() => {
  observerCallback = null;
  observeMock.mockClear();
  disconnectMock.mockClear();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observerCallback = cb;
      }
      observe = observeMock;
      disconnect = disconnectMock;
      unobserve = vi.fn();
      takeRecords = vi.fn();
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makePage<T>(
  items: T[],
  page: number,
  hasMore: boolean,
  total: number,
): PaginatedResult<T> {
  return { items, hasMore, total, page };
}

/** Trigger the sentinel coming into view. */
async function triggerSentinel() {
  await act(async () => {
    observerCallback?.([{ isIntersecting: true }]);
  });
}

describe('useInfiniteList', () => {
  it('loads page 1 on mount', async () => {
    const fetchPage = vi.fn().mockResolvedValue(makePage([1, 2, 3], 1, true, 9));

    const { result } = renderHook(() => useInfiniteList<number>(fetchPage, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage.mock.calls[0][0]).toBe(1);
    expect(result.current.items).toEqual([1, 2, 3]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(9);
  });

  it('appends the next page when the sentinel intersects', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(makePage([1, 2, 3], 1, true, 6))
      .mockResolvedValueOnce(makePage([4, 5, 6], 2, false, 6));

    const { result } = renderHook(() => useInfiniteList<number>(fetchPage, []));
    await waitFor(() => expect(result.current.items).toEqual([1, 2, 3]));

    // Attach the sentinel so the observer wires up.
    act(() => result.current.sentinelRef(document.createElement('div')));

    await triggerSentinel();

    await waitFor(() => expect(result.current.items).toEqual([1, 2, 3, 4, 5, 6]));
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage.mock.calls[1][0]).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('does not load past the end (hasMore=false)', async () => {
    const fetchPage = vi.fn().mockResolvedValue(makePage([1], 1, false, 1));

    const { result } = renderHook(() => useInfiniteList<number>(fetchPage, []));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.sentinelRef(document.createElement('div')));
    await triggerSentinel();

    // Still only the first page fetched.
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('resets to page 1 and re-fetches when a dependency changes (no stale concat)', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(makePage(['a1'], 1, true, 2))
      .mockResolvedValueOnce(makePage(['b1'], 1, false, 1));

    let dep = 'a';
    const { result, rerender } = renderHook(() => useInfiniteList<string>(fetchPage, [dep]));
    await waitFor(() => expect(result.current.items).toEqual(['a1']));

    dep = 'b';
    rerender();

    await waitFor(() => expect(result.current.items).toEqual(['b1']));
    // Fresh state — the previous dependency's items are NOT concatenated.
    expect(result.current.items).toEqual(['b1']);
    expect(fetchPage).toHaveBeenLastCalledWith(1, expect.anything());
  });

  it('drops a stale in-flight response when deps change mid-flight', async () => {
    let resolveFirst!: (v: PaginatedResult<string>) => void;
    const fetchPage = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<PaginatedResult<string>>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(makePage(['fresh'], 1, false, 1));

    let dep = 'a';
    const { result, rerender } = renderHook(() => useInfiniteList<string>(fetchPage, [dep]));

    // Change deps before the first request resolves.
    dep = 'b';
    rerender();
    await waitFor(() => expect(result.current.items).toEqual(['fresh']));

    // Now resolve the stale (superseded) first request — it must be ignored.
    await act(async () => {
      resolveFirst(makePage(['stale'], 1, true, 5));
    });

    expect(result.current.items).toEqual(['fresh']);
  });
});
