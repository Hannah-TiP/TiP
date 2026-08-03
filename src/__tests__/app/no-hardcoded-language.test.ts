import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * SMA-260 anti-regression guard: no API proxy route may hardcode the backend
 * `Language` header. The `Language` header is the first and WINNING rung of
 * the backend's language ladder, so a hardcoded value silently overrides the
 * user's stored `language_preference` (the original bug forced English on 24
 * proxies). A proxy must either forward a caller-supplied `?language=` (via
 * `languageHeader()` in src/lib/proxy-language.ts, or an equivalent
 * `Language: language` variable forward) or send no header at all.
 */

const API_ROOT = path.resolve(__dirname, '../../app/api');

// Matches a hardcoded Language header value, e.g. `Language: 'en'` or
// `Language: "kr"`. Variable forwards (`Language: language`) don't match.
const HARDCODED_LANGUAGE = /Language:\s*['"](en|kr)['"]/;

function collectRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectRouteFiles(full);
    return entry.isFile() && entry.name === 'route.ts' ? [full] : [];
  });
}

describe('API proxy language guard', () => {
  const routeFiles = collectRouteFiles(API_ROOT);

  it('finds the proxy route files', () => {
    // Sanity check so a broken glob can never silently pass the guard.
    expect(routeFiles.length).toBeGreaterThan(30);
  });

  it('no route hardcodes a Language header value', () => {
    const offenders = routeFiles.filter((file) =>
      HARDCODED_LANGUAGE.test(fs.readFileSync(file, 'utf8')),
    );
    expect(
      offenders.map((file) => path.relative(API_ROOT, file)),
      'Proxies must forward a caller-supplied ?language= (see src/lib/proxy-language.ts) ' +
        'or send no Language header — never a hardcoded value (SMA-260).',
    ).toEqual([]);
  });
});
