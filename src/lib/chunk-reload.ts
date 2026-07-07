/**
 * Detect a Next.js/webpack chunk-load failure.
 *
 * These happen when a user has an old bundle open and a redeploy removes the
 * hashed chunk files they still reference. A single reload pulls the fresh
 * bundle and recovers — so error boundaries treat it specially instead of
 * showing an error card.
 */
export function isChunkLoadError(error: { name?: string; message?: string }): boolean {
  if (error.name === 'ChunkLoadError') return true;
  return /Loading chunk [\d]+ failed/.test(error.message ?? '');
}

const RELOAD_GUARD_KEY = 'chunk-reloaded';

/**
 * If `error` is a chunk-load failure, reload the page ONCE and return true.
 *
 * A `sessionStorage` flag guards against reload loops: if we already reloaded
 * for a chunk error this session and still hit one, we fall through (return
 * false) so the boundary renders its error card instead of reloading forever.
 * Callers should clear the flag on a successful mount (see
 * `clearChunkReloadGuard`).
 */
export function handleChunkReload(error: { name?: string; message?: string }): boolean {
  if (!isChunkLoadError(error)) return false;
  if (typeof window === 'undefined') return false;

  const alreadyReloaded = window.sessionStorage.getItem(RELOAD_GUARD_KEY) === 'true';
  if (alreadyReloaded) return false;

  window.sessionStorage.setItem(RELOAD_GUARD_KEY, 'true');
  window.location.reload();
  return true;
}

/**
 * Clear the chunk-reload loop guard. Call this once a component mounts
 * successfully so a future, unrelated chunk error can reload again.
 */
export function clearChunkReloadGuard(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(RELOAD_GUARD_KEY);
}
