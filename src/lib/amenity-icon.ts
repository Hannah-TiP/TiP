// Resolves HotelFeature.icon values to renderable glyphs.
//
// Production hotels_v2 data stores two shapes of icon value: literal emoji
// (rendered as-is) and Material-style keywords like "restaurant" or
// "child_care" (previously rendered as literal words). Keywords map to Lucide
// font glyphs below. Codepoints are read from the PINNED lucide-static version
// linked in src/app/layout.tsx (font/lucide.css) — when bumping the pin,
// re-verify every codepoint against the new version's lucide.css.

export type AmenityIconKind = 'emoji' | 'lucide';

export interface ResolvedAmenityIcon {
  kind: AmenityIconKind;
  char: string;
}

const lucide = (char: string): ResolvedAmenityIcon => ({ kind: 'lucide', char });
const emoji = (char: string): ResolvedAmenityIcon => ({ kind: 'emoji', char });

/**
 * Alias keywords that collapse onto a canonical map entry. Keys and values are
 * post-normalization (lowercase, hyphens folded to underscores) — e.g.
 * "ev-charging"/"hot-tub" need no alias entry because normalization already
 * folds them onto "ev_charging"/"hot_tub".
 */
export const AMENITY_ICON_ALIASES: Record<string, string> = {
  beach_access: 'beach',
  bicycle: 'bike',
  pedal_bike: 'bike',
  child_care: 'child',
  kids: 'child',
  fitness_center: 'fitness',
  golf_course: 'golf',
  local_cafe: 'coffee',
  local_parking: 'parking',
  sports_tennis: 'tennis',
};

/**
 * Canonical keyword → glyph. `null` marks known junk labels ("amenity",
 * "amenities") that intentionally render no icon. Lucide codepoints from
 * lucide-static@1.27.0; entries without a suitable Lucide glyph use a curated
 * emoji fallback. New keywords are one-line additions here.
 */
export const AMENITY_ICON_MAP: Record<string, ResolvedAmenityIcon | null> = {
  ac_unit: lucide('\ue165'), // snowflake
  amenity: null,
  amenities: null,
  art: lucide('\ue1dd'), // palette
  bar: lucide('\ue2e3'), // martini
  beach: lucide('\ue281'), // tree-palm
  bed: lucide('\ue2c1'), // bed
  bike: lucide('\ue1d2'), // bike
  child: lucide('\ue2ce'), // baby
  coffee: lucide('\ue096'), // coffee
  concierge: lucide('\ue378'), // concierge-bell
  eco: lucide('\ue2de'), // leaf
  entertainment: lucide('\ue521'), // drama
  ev_charging: lucide('\ue45c'), // plug-zap
  explore: lucide('\ue09b'), // compass
  fitness: lucide('\ue3a1'), // dumbbell
  flight: lucide('\ue1de'), // plane
  garden: lucide('\ue2d3'), // flower
  gift: lucide('\ue0e1'), // gift
  golf: lucide('\ue528'), // land-plot
  gondola: lucide('\ue4fc'), // cable-car
  helicopter: emoji('🚁'), // no lucide helicopter glyph
  hot_tub: lucide('\ue2ab'), // bath
  lock: lucide('\ue10b'), // lock
  lounge: lucide('\ue2c0'), // armchair
  meeting_room: lucide('\ue4ae'), // presentation
  minibar: lucide('\ue37b'), // refrigerator
  outdoor: lucide('\ue231'), // mountain
  park: lucide('\ue2f5'), // trees
  parking: lucide('\ue3cb'), // square-parking
  person: lucide('\ue19f'), // user
  pets: lucide('\ue4f5'), // paw-print
  pool: lucide('\ue63b'), // waves-ladder
  restaurant: lucide('\ue2f6'), // utensils
  room_service: lucide('\ue5ba'), // hand-platter
  ski: emoji('⛷️'), // no lucide ski glyph
  spa: lucide('\ue2d4'), // flower-2
  sports: lucide('\ue373'), // trophy
  surfing: emoji('🏄'), // no lucide surfing glyph
  sustainability: lucide('\ue2e9'), // recycle
  tech: lucide('\ue3a2'), // monitor-smartphone
  tennis: emoji('🎾'), // no lucide tennis glyph
  terrace: lucide('\ue178'), // sun
  visibility: lucide('\ue0ba'), // eye
  watersports: lucide('\ue37e'), // sailboat
  wellness: lucide('\ue36e'), // heart-pulse
  wifi: lucide('\ue1ae'), // wifi
  wine: lucide('\ue2f8'), // wine
  yoga: emoji('🧘'), // no lucide yoga glyph
};

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

export function resolveAmenityIcon(icon: string | null | undefined): ResolvedAmenityIcon | null {
  if (!icon) return null;
  const trimmed = icon.trim();
  if (!trimmed) return null;
  if (EMOJI_PATTERN.test(trimmed)) return { kind: 'emoji', char: trimmed };
  const normalized = trimmed.toLowerCase().replace(/-/g, '_');
  const canonical = AMENITY_ICON_ALIASES[normalized] ?? normalized;
  return AMENITY_ICON_MAP[canonical] ?? null;
}
