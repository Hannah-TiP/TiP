import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/locale';

/**
 * Private / transactional paths kept out of the index. Auth routes are
 * `/sign-in`, `/register`, `/forgot-password` (the real route names in
 * `src/app`). `/my-page`, `/checkout`, `/quotes` are authed surfaces; `/api` is
 * the proxy layer.
 */
export const DISALLOWED_PATHS = [
  '/my-page',
  '/checkout',
  '/quotes',
  '/api',
  '/sign-in',
  '/register',
  '/forgot-password',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOWED_PATHS],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
