import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useVerificationDeliveryStatus,
  POLL_INTERVAL_MS,
  MAX_POLLS,
} from '@/hooks/useVerificationDeliveryStatus';

const fetchMock = vi.fn();

function pendingResponse() {
  return {
    ok: true,
    json: async () => ({ status: 'pending', reason_category: null }),
  };
}

function failedResponse(reason = 'blocked') {
  return {
    ok: true,
    json: async () => ({ status: 'failed', reason_category: reason }),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useVerificationDeliveryStatus', () => {
  it('does not poll while inactive', async () => {
    renderHook(() => useVerificationDeliveryStatus('user@hanmail.net', false));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not poll without an email', async () => {
    renderHook(() => useVerificationDeliveryStatus('', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('polls the status endpoint every 5s while pending', async () => {
    fetchMock.mockResolvedValue(pendingResponse());

    const { result } = renderHook(() => useVerificationDeliveryStatus('user@hanmail.net', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/verification-delivery-status?email=user%40hanmail.net',
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.failed).toBe(false);
  });

  it('flips to failed and stops polling on a failed status', async () => {
    fetchMock.mockResolvedValueOnce(pendingResponse()).mockResolvedValueOnce(failedResponse());

    const { result } = renderHook(() => useVerificationDeliveryStatus('user@hanmail.net', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    });

    expect(result.current.failed).toBe(true);
    expect(result.current.reasonCategory).toBe('blocked');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Terminal state — no further polls.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 5);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops polling on unmount', async () => {
    fetchMock.mockResolvedValue(pendingResponse());

    const { unmount } = renderHook(() => useVerificationDeliveryStatus('user@hanmail.net', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resets failed state when active turns off', async () => {
    fetchMock.mockResolvedValue(failedResponse());

    const { result, rerender } = renderHook(
      ({ active }) => useVerificationDeliveryStatus('user@hanmail.net', active),
      { initialProps: { active: true } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(result.current.failed).toBe(true);

    rerender({ active: false });
    expect(result.current.failed).toBe(false);
    expect(result.current.reasonCategory).toBeNull();
  });

  it('skips the fetch while the tab is hidden', async () => {
    fetchMock.mockResolvedValue(pendingResponse());
    const hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

    renderHook(() => useVerificationDeliveryStatus('user@hanmail.net', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    // Tab becomes visible again — polling resumes on the next tick.
    hiddenSpy.mockReturnValue(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps polling through network errors and gives up after the budget', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useVerificationDeliveryStatus('user@hanmail.net', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * (MAX_POLLS + 5));
    });

    expect(fetchMock).toHaveBeenCalledTimes(MAX_POLLS);
    expect(result.current.failed).toBe(false);
  });
});
