// Lucide font glyphs used directly in component JSX (`<span className="icon-lucide">`).
//
// Codepoints are read from the PINNED lucide-static version linked in
// src/app/layout.tsx (https://unpkg.com/lucide-static@1.27.0/font/lucide.css) —
// when bumping the pin, re-verify every codepoint against the new version's
// lucide.css. Components must import these constants instead of hardcoding
// character entities: the hardcoded entities had drifted to Material Icons
// codepoints and rendered tofu boxes against the Lucide font.

export const LUCIDE_ICONS = {
  search: '\ue151', // lucide search
  sparkles: '\ue412', // lucide sparkles
  arrowRight: '\ue049', // lucide arrow-right
  x: '\ue1b2', // lucide x
  check: '\ue06c', // lucide check
  mapPin: '\ue111', // lucide map-pin
} as const;

export type LucideIconName = keyof typeof LUCIDE_ICONS;
