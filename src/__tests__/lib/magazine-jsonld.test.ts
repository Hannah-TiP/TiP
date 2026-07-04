import { describe, it, expect } from 'vitest';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildMagazineJsonLd,
  articleCanonicalUrl,
  JSONLD_BUILDERS,
} from '@/lib/seo/magazine-jsonld';
import { SITE_ORIGIN } from '@/lib/seo/locale';
import type { MagazineArticleDetail } from '@/types/magazine';

function detailFixture(
  overrides: Partial<MagazineArticleDetail['article']> = {},
): MagazineArticleDetail {
  return {
    article: {
      id: 1,
      type: 'destination',
      slug: 'best-hotels-in-japan',
      status: 'published',
      published_at: '2026-01-10T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
      title: { en: 'Best Hotels in Japan', kr: '일본 최고의 호텔' },
      summary: { en: 'A curated list.', kr: '엄선된 목록.' },
      hero_image: { original: 'https://cdn.example.com/japan.jpg' },
      hero_alt: { en: 'Kyoto skyline', kr: '교토 스카이라인' },
      key_takeaways: [{ text: { en: 'Book early.', kr: '일찍 예약하세요.' } }],
      body: [],
      faqs: [
        {
          question: { en: 'When to visit?', kr: '언제 방문하나요?' },
          answer: { en: 'Spring or autumn.', kr: '봄 또는 가을.' },
        },
      ],
      seo: null,
      type_payload: null,
      tags: [{ en: 'luxury', kr: '럭셔리' }],
      schema_version: 1,
      created_at: null,
      ...overrides,
    },
    relations: [],
    available_locales: ['en', 'kr'],
  };
}

describe('articleCanonicalUrl', () => {
  it('maps the singular type enum back to the plural URL segment', () => {
    expect(articleCanonicalUrl('destination', 'x')).toBe(`${SITE_ORIGIN}/magazine/destinations/x`);
    expect(articleCanonicalUrl('news', 'y')).toBe(`${SITE_ORIGIN}/magazine/news/y`);
    expect(articleCanonicalUrl('insider', 'z')).toBe(`${SITE_ORIGIN}/magazine/insider/z`);
  });
});

describe('buildArticleJsonLd', () => {
  it('binds headline/description/image/dates and localizes to the requested lang', () => {
    const node = buildArticleJsonLd(detailFixture(), 'kr')!;
    expect(node['@type']).toBe('Article');
    expect(node.headline).toBe('일본 최고의 호텔');
    expect(node.description).toBe('엄선된 목록.');
    expect(node.image).toBe('https://cdn.example.com/japan.jpg');
    expect(node.datePublished).toBe('2026-01-10T00:00:00Z');
    expect(node.dateModified).toBe('2026-02-01T00:00:00Z');
    expect(node.url).toBe(`${SITE_ORIGIN}/magazine/destinations/best-hotels-in-japan`);
    expect(node.publisher).toEqual({ '@type': 'Organization', name: 'Travel in Your Pocket' });
  });

  it('omits empty keys (no image / no dates)', () => {
    const node = buildArticleJsonLd(
      detailFixture({ hero_image: null, published_at: null, updated_at: null, summary: null }),
      'en',
    )!;
    expect('image' in node).toBe(false);
    expect('datePublished' in node).toBe(false);
    expect('dateModified' in node).toBe(false);
    expect('description' in node).toBe(false);
  });
});

describe('buildFaqPageJsonLd', () => {
  it('builds a FAQPage from answerable FAQs', () => {
    const node = buildFaqPageJsonLd(detailFixture(), 'en')!;
    expect(node['@type']).toBe('FAQPage');
    expect(node.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'When to visit?',
        acceptedAnswer: { '@type': 'Answer', text: 'Spring or autumn.' },
      },
    ]);
  });

  it('drops FAQs missing a question or answer, and returns null when none remain', () => {
    const node = buildFaqPageJsonLd(
      detailFixture({
        faqs: [
          { question: { en: 'No answer?', kr: null }, answer: null },
          { question: null, answer: { en: 'Orphan answer', kr: null } },
        ],
      }),
      'en',
    );
    expect(node).toBeNull();
  });

  it('returns null when there are no FAQs at all', () => {
    expect(buildFaqPageJsonLd(detailFixture({ faqs: null }), 'en')).toBeNull();
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('emits the baked Home → Magazine (/magazine) → title hierarchy', () => {
    const node = buildBreadcrumbJsonLd(detailFixture(), 'en')!;
    expect(node['@type']).toBe('BreadcrumbList');
    expect(node.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Magazine', item: `${SITE_ORIGIN}/magazine` },
      { '@type': 'ListItem', position: 3, name: 'Best Hotels in Japan' },
    ]);
  });

  it('falls back to the slug when the title is empty', () => {
    const node = buildBreadcrumbJsonLd(detailFixture({ title: null }), 'en')!;
    const crumbs = node.itemListElement as Array<{ name: string }>;
    expect(crumbs[2].name).toBe('best-hotels-in-japan');
  });
});

describe('buildMagazineJsonLd dispatch table', () => {
  it('emits the base stack (Article + FAQPage + BreadcrumbList) for every type', () => {
    for (const type of Object.keys(JSONLD_BUILDERS) as Array<keyof typeof JSONLD_BUILDERS>) {
      const nodes = buildMagazineJsonLd(detailFixture({ type }), 'en');
      expect(nodes.map((n) => n['@type'])).toEqual(['Article', 'FAQPage', 'BreadcrumbList']);
    }
  });

  it('drops the FAQPage node when the article has no FAQs', () => {
    const nodes = buildMagazineJsonLd(detailFixture({ faqs: null }), 'en');
    expect(nodes.map((n) => n['@type'])).toEqual(['Article', 'BreadcrumbList']);
  });
});

describe('FAQPage parity with the on-screen FAQ payload', () => {
  it('builds the FAQPage from the SAME faqs the accordion renders', () => {
    const detail = detailFixture({
      faqs: [
        {
          question: { en: 'Q1', kr: '질문1' },
          answer: { en: 'A1', kr: '답1' },
        },
        {
          question: { en: 'Q2', kr: '질문2' },
          answer: { en: 'A2', kr: '답2' },
        },
      ],
    });

    // The accordion renders every faq with both a question and answer,
    // localized to the active lang. The FAQPage JSON-LD must match 1:1.
    const onScreen = (detail.article.faqs ?? [])
      .filter((f) => f.question && f.answer)
      .map((f) => ({ q: f.question!.en, a: f.answer!.en }));

    const node = buildFaqPageJsonLd(detail, 'en')!;
    const jsonld = (
      node.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>
    ).map((m) => ({ q: m.name, a: m.acceptedAnswer.text }));

    expect(jsonld).toEqual(onScreen);
  });
});
