'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginatedResult } from '@/types/common';

export interface UseInfiniteListResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  /** Attach to the IntersectionObserver sentinel element at the grid bottom. */
  sentinelRef: (node: HTMLElement | null) => void;
}

/**
 * Reusable infinite-scroll list driver.
 *
 * Owns page state, fetching, appending and reset-on-dependency-change, plus the
 * IntersectionObserver wiring that loads the next page when a sentinel element
 * scrolls into view (with a generous `rootMargin` so the next page is in flight
 * before the user reaches the very bottom).
 *
 * `fetchPage(page, signal)` must resolve a {@link PaginatedResult}. When any
 * value in `deps` changes the list resets to page 1 and re-fetches — in-flight
 * responses from the previous dependency set are dropped (AbortController +
 * request-id guard) so late responses never pollute the fresh state.
 */
export function useInfiniteList<T>(
  fetchPage: (page: number, signal: AbortSignal) => Promise<PaginatedResult<T>>,
  deps: ReadonlyArray<unknown>,
  options?: { rootMargin?: string },
): UseInfiniteListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Monotonic id bumped on every reset so stale in-flight fetches can detect
  // they belong to a superseded dependency set and bail out.
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Keep the latest fetcher without making it a load dependency — only `deps`
  // should trigger a reset, not a new closure identity on every render.
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const rootMargin = options?.rootMargin ?? '200px';

  const load = useCallback(async (page: number, requestId: number, append: boolean) => {
    // `append` loads (next page) are skipped while a request is in flight to
    // avoid duplicate fetches. A reset (`append === false`) always proceeds —
    // it supersedes any in-flight request (aborted below + request-id guard).
    if (append && inFlightRef.current) return;
    inFlightRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await fetchPageRef.current(page, controller.signal);
      // A reset happened mid-flight — discard this (stale) response.
      if (requestId !== requestIdRef.current) return;

      pageRef.current = result.page;
      hasMoreRef.current = result.hasMore;
      setHasMore(result.hasMore);
      setTotal(result.total);
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      console.error('useInfiniteList: failed to load page', error);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        inFlightRef.current = false;
      }
    }
  }, []);

  // Reset + load page 1 whenever the dependency set changes.
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    pageRef.current = 1;
    hasMoreRef.current = false;
    setItems([]);
    setHasMore(false);
    load(1, requestId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadNext = useCallback(() => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    load(pageRef.current + 1, requestIdRef.current, true);
  }, [load]);

  // IntersectionObserver attached via a ref callback so it re-binds if the
  // sentinel node is mounted/unmounted (e.g. when the footer toggles).
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadNext();
          }
        },
        { rootMargin },
      );
      observerRef.current.observe(node);
    },
    [loadNext, rootMargin],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      abortRef.current?.abort();
    };
  }, []);

  return { items, total, hasMore, isLoading, isLoadingMore, sentinelRef };
}
