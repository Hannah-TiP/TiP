import { describe, it, expect } from 'vitest';
import { buildMagazineMetadata } from '@/lib/seo/magazine-metadata';
import { krToBcp47, krToOgLocale, localeToHreflang, SITE_ORIGIN } from '@/lib/seo/locale';
import type { MagazineArticleDetail } from '@/types/magazine';

function detailFixture(
  overrides: Partial<MagazineArticleDetail['article']> = {},
  detailOverrides: Partial<MagazineArticleDetail> = {},
): MagazineArticleDetail {
  return {
    article: {
      id: 1,
      type: 'guide',
      slug: 'tokyo-first-timer',
      status: 'published',
      published_at: '2026-01-10T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      title: { en: 'Tokyo for First-Timers', kr: '처음 가는 도쿄' },
      summary: { en: 'The essentials.', kr: '핵심만.' },
      hero_image: { original: 'https://cdn.example.com/hero.jpg' },
      hero_alt: null,
      key_takeaways: null,
      body: null,
      faqs: null,
      seo: null,
      type_payload: null,
      tags: [],
      schema_version: 1,
      created_at: null,
      ...overrides,
    },
    relations: [],
    related: [],
    available_locales: ['en', 'kr'],
    ...detailOverrides,
  };
}

describe('krToBcp47 / krToOgLocale / localeToHreflang', () => {
  it('maps kr → ko for BCP-47 and ko_KR for OG at emit time', () => {
    expect(krToBcp47('kr')).toBe('ko');
    expect(krToBcp47('en')).toBe('en');
    expect(krToOgLocale('kr')).toBe('ko_KR');
    expect(krToOgLocale('en')).toBe('en_US');
  });

  it('normalizes available_locales entries to hreflang tags', () => {
    expect(localeToHreflang('kr')).toBe('ko');
    expect(localeToHreflang('ko')).toBe('ko');
    expect(localeToHreflang('en')).toBe('en');
    expect(localeToHreflang('FR')).toBe('fr');
  });
});

describe('buildMagazineMetadata', () => {
  it('uses seo overrides when present', () => {
    const meta = buildMagazineMetadata(
      detailFixture({
        seo: {
          meta_title: { en: 'SEO Title', kr: 'SEO 제목' },
          meta_description: { en: 'SEO Desc', kr: 'SEO 설명' },
          og_image: { original: 'https://cdn.example.com/og.jpg' },
        },
      }),
      'en',
    );
    expect(meta.title).toBe('SEO Title');
    expect(meta.description).toBe('SEO Desc');
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/og.jpg' }]);
  });

  it('falls back to title/summary/hero_image when seo is empty', () => {
    const meta = buildMagazineMetadata(detailFixture(), 'en');
    expect(meta.title).toBe('Tokyo for First-Timers');
    expect(meta.description).toBe('The essentials.');
    expect(meta.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/hero.jpg' }]);
  });

  it('localizes to kr and sets the ko_KR OG locale, i18n key untouched', () => {
    const meta = buildMagazineMetadata(detailFixture(), 'kr');
    expect(meta.title).toBe('처음 가는 도쿄');
    expect(meta.description).toBe('핵심만.');
    expect(meta.openGraph?.locale).toBe('ko_KR');
  });

  it('emits an absolute canonical mapping the plural segment', () => {
    const meta = buildMagazineMetadata(detailFixture(), 'en');
    expect(meta.alternates?.canonical).toBe(`${SITE_ORIGIN}/magazine/guides/tokyo-first-timer`);
  });

  it('limits alternates.languages to available_locales, mapped to hreflang', () => {
    const meta = buildMagazineMetadata(detailFixture({}, { available_locales: ['en'] }), 'en');
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(Object.keys(languages)).toEqual(['en']);
    expect(languages.en).toBe(`${SITE_ORIGIN}/magazine/guides/tokyo-first-timer`);
  });

  it('includes ko in alternates when the kr locale is available', () => {
    const meta = buildMagazineMetadata(detailFixture(), 'en');
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(Object.keys(languages).sort()).toEqual(['en', 'ko']);
  });

  it('uses a summary twitter card when there is no image', () => {
    const meta = buildMagazineMetadata(detailFixture({ hero_image: null }), 'en');
    expect((meta.twitter as { card?: string })?.card).toBe('summary');
  });
});
