'use client';

import { Suspense, lazy } from 'react';

// SMA-306: Footer is statically imported by ~30 route islands, and Turbopack
// inlines small shared modules into every chunk group — duplicating the whole
// footer implementation into ~30 client chunks. Lazy-loading the content keeps
// this wrapper tiny and moves the real footer into ONE shared async chunk
// (reclaiming ~80KB against the bundle-size gate). Deliberately React.lazy,
// NOT next/dynamic — next/dynamic's loader machinery would itself be
// duplicated into every importing chunk (the SMA-280 lesson); React.lazy rides
// the shared React runtime. SSR still renders the footer HTML; the client
// hydrates the boundary once the chunk arrives.
const FooterContent = lazy(() => import('@/components/FooterContent'));

export default function Footer() {
  return (
    <Suspense fallback={null}>
      <FooterContent />
    </Suspense>
  );
}
