// Local-state cleanup for account deletion (SMA-187).
//
// Removes exactly the per-user local state families — the language override,
// the active concierge session pointer, and every per-trip review
// draft/skip store. Deliberately leaves `tip-cookie-consent` and the
// `tiyp_popup_dismiss_until_v2_<lang>` keys untouched (device-level
// preferences, not account data).
export function clearLocalAccountState(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null) keys.push(key);
  }
  keys
    .filter(
      (k) =>
        k === 'tip-lang' ||
        k === 'concierge_active_session_id' ||
        k.startsWith('tip-review-drafts:') ||
        k.startsWith('tip-review-skips:'),
    )
    .forEach((k) => localStorage.removeItem(k));
}
