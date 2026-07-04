import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { UserProvider } from '@/contexts/UserContext';
import Header from '@/components/Header';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { resolveServerLanguage } from '@/lib/detect-language';
import { SITE_ORIGIN } from '@/lib/seo/locale';
import { buildTravelAgencyJsonLd } from '@/lib/seo/signature-journey-jsonld';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: 'TiP - Luxury Travel Concierge',
  description: 'Dream Hotels, Thoughtfully Curated.',
  icons: {
    icon: '/bible_TIP_profil_400x400px.svg',
    apple: '/bible_TIP_profil_400x400px.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const acceptLanguage = (await headers()).get('accept-language');
  const initialLang = resolveServerLanguage(acceptLanguage);
  const htmlLang = initialLang === 'kr' ? 'ko' : 'en';

  return (
    <html lang={htmlLang} className="h-full">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router layout, not Pages Router */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link href="https://unpkg.com/lucide-static@latest/font/lucide.css" rel="stylesheet" />
        {/* Site-wide TravelAgency structured data (Paris Class). Emitted ONCE
            here; per-page signature-journey blocks reference it as provider. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildTravelAgencyJsonLd()) }}
        />
      </head>
      <body className="h-full antialiased font-secondary">
        <SessionProvider>
          <LanguageProvider initialLang={initialLang}>
            <UserProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                {children}
              </div>
              <CookieConsentBanner />
            </UserProvider>
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
