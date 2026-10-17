const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/**
 * Human-readable file size using 1024-based units ("1.2 MB", "340 KB",
 * "512 B"). One decimal below 10 of a unit, whole numbers above; '' for a
 * negative / non-finite input.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  if (unit === 0) return `${value} ${UNITS[0]}`;
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded} ${UNITS[unit]}`;
}
