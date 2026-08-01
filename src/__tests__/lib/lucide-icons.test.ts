import { describe, expect, it } from 'vitest';
import { LUCIDE_ICONS } from '@/lib/lucide-icons';

// Expected values read from the pinned font:
// https://unpkg.com/lucide-static@1.27.0/font/lucide.css
// Each entry is [constant key, lucide icon class name, codepoint].
const PINNED_CODEPOINTS: ReadonlyArray<readonly [keyof typeof LUCIDE_ICONS, string, string]> = [
  ['search', 'search', '\ue151'],
  ['sparkles', 'sparkles', '\ue412'],
  ['arrowRight', 'arrow-right', '\ue049'],
  ['x', 'x', '\ue1b2'],
  ['check', 'check', '\ue06c'],
  ['mapPin', 'map-pin', '\ue111'],
];

describe('LUCIDE_ICONS', () => {
  it.each(PINNED_CODEPOINTS)(
    'pins "%s" to the lucide-static@1.27.0 "%s" glyph',
    (key, _iconName, codepoint) => {
      expect(LUCIDE_ICONS[key]).toBe(codepoint);
    },
  );

  it('exposes exactly the pinned set of icon keys', () => {
    expect(Object.keys(LUCIDE_ICONS).sort()).toEqual(PINNED_CODEPOINTS.map(([key]) => key).sort());
  });

  it('holds single Private Use Area characters, not markup entities', () => {
    for (const glyph of Object.values(LUCIDE_ICONS)) {
      expect(glyph).toHaveLength(1);
      const code = glyph.codePointAt(0)!;
      expect(code).toBeGreaterThanOrEqual(0xe000);
      expect(code).toBeLessThanOrEqual(0xf8ff);
    }
  });

  it('maps every concept to a distinct glyph', () => {
    const glyphs = Object.values(LUCIDE_ICONS);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('does not reuse the Material Icons codepoints that rendered as tofu', () => {
    const brokenCodepoints = ['\ue8b6', '\ue986', '\ue817', '\ue8db', '\ue86c', '\ue551'];
    for (const glyph of Object.values(LUCIDE_ICONS)) {
      expect(brokenCodepoints).not.toContain(glyph);
    }
  });
});
