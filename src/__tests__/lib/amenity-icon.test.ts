import { describe, expect, it } from 'vitest';
import { AMENITY_ICON_ALIASES, AMENITY_ICON_MAP, resolveAmenityIcon } from '@/lib/amenity-icon';

// Full production emoji vocabulary (read-only hotels_v2 audit, SMA-241).
const PRODUCTION_EMOJI = [
  '🍱',
  '🏊',
  '💪',
  '🏖️',
  '🧖',
  '♨️',
  '🍽️',
  '🍸',
  '🎾',
  '🍷',
  '📶',
  '🛎️',
  '🌳',
  '🎨',
  '🎩',
  '👶',
  '🚤',
  '🥃',
];

// Full production keyword vocabulary (same audit). Junk labels excluded here —
// they are asserted separately to resolve to no icon.
const PRODUCTION_KEYWORDS = [
  'restaurant',
  'spa',
  'pool',
  'wifi',
  'fitness',
  'bar',
  'concierge',
  'beach',
  'child_care',
  'eco',
  'entertainment',
  'minibar',
  'pedal_bike',
  'person',
  'sports',
  'wine',
  'art',
  'beach_access',
  'bike',
  'child',
  'coffee',
  'flight',
  'garden',
  'golf_course',
  'local_cafe',
  'local_parking',
  'outdoor',
  'parking',
  'pets',
  'room_service',
  'sports_tennis',
  'sustainability',
  'tech',
  'tennis',
  'watersports',
  'wellness',
  'yoga',
  'ac_unit',
  'bed',
  'bicycle',
  'ev_charging',
  'ev-charging',
  'explore',
  'fitness_center',
  'gift',
  'golf',
  'gondola',
  'helicopter',
  'hot_tub',
  'hot-tub',
  'kids',
  'lock',
  'lounge',
  'meeting_room',
  'park',
  'ski',
  'surfing',
  'terrace',
  'visibility',
];

const JUNK_KEYWORDS = ['amenity', 'amenities'];

const ALIAS_CLUSTERS: string[][] = [
  ['ev_charging', 'ev-charging'],
  ['hot_tub', 'hot-tub'],
  ['bike', 'bicycle', 'pedal_bike'],
  ['tennis', 'sports_tennis'],
  ['fitness', 'fitness_center'],
  ['golf', 'golf_course'],
  ['parking', 'local_parking'],
  ['coffee', 'local_cafe'],
  ['child', 'child_care', 'kids'],
  ['beach', 'beach_access'],
];

describe('resolveAmenityIcon', () => {
  describe('emoji passthrough', () => {
    it.each(PRODUCTION_EMOJI)('passes production emoji %s through unchanged', (icon) => {
      expect(resolveAmenityIcon(icon)).toEqual({ kind: 'emoji', char: icon });
    });

    it('trims surrounding whitespace from an emoji value', () => {
      expect(resolveAmenityIcon(' 🏊 ')).toEqual({ kind: 'emoji', char: '🏊' });
    });
  });

  describe('keyword mapping', () => {
    it.each(PRODUCTION_KEYWORDS)('resolves production keyword "%s" to a glyph', (keyword) => {
      const resolved = resolveAmenityIcon(keyword);
      expect(resolved).not.toBeNull();
      expect(['emoji', 'lucide']).toContain(resolved!.kind);
      expect(resolved!.char.length).toBeGreaterThan(0);
      // Never the literal keyword text
      expect(resolved!.char).not.toBe(keyword);
    });

    it('maps "restaurant" to a lucide glyph (utensils)', () => {
      expect(resolveAmenityIcon('restaurant')).toEqual({ kind: 'lucide', char: '\ue2f6' });
    });

    it.each(ALIAS_CLUSTERS.map((cluster) => [cluster[0], cluster] as const))(
      'alias cluster of "%s" resolves every member to the same glyph',
      (_canonical, cluster) => {
        const resolutions = cluster.map((value) => resolveAmenityIcon(value));
        for (const resolved of resolutions) {
          expect(resolved).not.toBeNull();
          expect(resolved).toEqual(resolutions[0]);
        }
      },
    );

    it('normalizes case, whitespace, and hyphens before lookup', () => {
      expect(resolveAmenityIcon('  Restaurant ')).toEqual(resolveAmenityIcon('restaurant'));
      expect(resolveAmenityIcon('EV-Charging')).toEqual(resolveAmenityIcon('ev_charging'));
      expect(resolveAmenityIcon('HOT-TUB')).toEqual(resolveAmenityIcon('hot_tub'));
    });

    it('every alias points at an existing canonical map entry', () => {
      for (const canonical of Object.values(AMENITY_ICON_ALIASES)) {
        expect(AMENITY_ICON_MAP[canonical]).toBeTruthy();
      }
    });
  });

  describe('suppression', () => {
    it.each(JUNK_KEYWORDS)('renders no icon for junk label "%s"', (keyword) => {
      expect(resolveAmenityIcon(keyword)).toBeNull();
    });

    it('returns null for unmapped non-emoji values', () => {
      expect(resolveAmenityIcon('totally_unknown_keyword')).toBeNull();
      expect(resolveAmenityIcon('foobar')).toBeNull();
    });

    it('returns null for empty and missing values', () => {
      expect(resolveAmenityIcon(null)).toBeNull();
      expect(resolveAmenityIcon(undefined)).toBeNull();
      expect(resolveAmenityIcon('')).toBeNull();
      expect(resolveAmenityIcon('   ')).toBeNull();
    });
  });
});
