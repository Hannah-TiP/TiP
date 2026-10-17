import { describe, expect, it } from 'vitest';
import { formatFileSize } from '@/lib/format-file-size';

describe('formatFileSize', () => {
  it('formats bytes, KB and MB with 1024-based units', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(340 * 1024)).toBe('340 KB');
    expect(formatFileSize(1.2 * 1024 * 1024)).toBe('1.2 MB');
    expect(formatFileSize(25 * 1024 * 1024)).toBe('25 MB');
  });

  it('keeps one decimal only below 10 of a unit', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(15.6 * 1024)).toBe('16 KB');
  });

  it('returns empty string for invalid sizes', () => {
    expect(formatFileSize(-1)).toBe('');
    expect(formatFileSize(Number.NaN)).toBe('');
  });
});
