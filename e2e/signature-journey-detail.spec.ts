import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * E2E for the /signature-journeys/[slug] detail page (SMA-209).
 *
 * Renders the modular signature_journeys_v2 layout: Hero → About →
 * Highlights → Units → Sample Routes → Specs → Inclusions → Booking
 * Benefits → FAQ → Concierge CTA. Sections without data must be hidden
 * (the fixture deliberately omits `units`).
 *
 * Strategy: intercept the /api/signature-journeys/[slug] proxy and serve a
 * language-collapsed fixture per ?language= — mirroring the backend, which
 * collapses MultiLanguageStrings to the requested `lang` header.
 */

const SLUG = 'grand-mediterranean-voyage';

const IMG = 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=1200&h=675&fit=crop';

function mls(en: string | null, kr: string | null) {
  return { en, kr };
}

function journeyFixture(language: 'en' | 'kr') {
  const text = (en: string, kr: string) => (language === 'kr' ? mls(null, kr) : mls(en, null));
  return {
    id: 42,
    city_id: 10,
    slug: SLUG,
    status: 'published',
    title: text('Grand Mediterranean Voyage', '그랜드 지중해 항해'),
    description: text('Seven nights aboard an all-suite yacht.', '올스위트 요트에서의 7박.'),
    hero_image: { original: IMG },
    cover_image: { original: IMG },
    lead: text('A private yacht, chartered for the rare few.', '소수만을 위한 프라이빗 요트.'),
    body: text('From Barcelona to Rome, every detail is handled.', '바르셀로나에서 로마까지.'),
    gallery: [{ original: IMG }, { original: IMG }],
    highlights: [
      {
        title: text('All-Suite Yacht', '올스위트 요트'),
        desc: text('Every suite has a private terrace.', '모든 스위트에 프라이빗 테라스.'),
      },
      {
        title: text('Michelin Dining', '미쉐린 다이닝'),
        desc: text('S.E.A. by Sven Elverfeld.', '스벤 엘버펠트의 S.E.A.'),
      },
    ],
    units: null, // deliberately absent — the Units section must be hidden
    routes: [
      {
        region: text('Mediterranean', '지중해'),
        title: text('Barcelona to Rome', '바르셀로나에서 로마까지'),
        stops: text('Barcelona — Palma — Ajaccio — Rome', '바르셀로나 — 팔마 — 아작시오 — 로마'),
        meta: text('7 nights', '7박'),
        map_image: { original: IMG },
      },
    ],
    specs: [
      { key: text('Duration', '기간'), value: text('7 nights', '7박') },
      { key: text('Capacity', '정원'), value: text('298 guests', '298명') },
    ],
    inclusions: [
      { item: text('All gratuities', '모든 봉사료 포함') },
      { item: text('Wi-Fi throughout the voyage', '항해 전 구간 와이파이') },
    ],
    faqs: [
      {
        question: text('Is airfare included?', '항공권이 포함되나요?'),
        answer: text('Airfare is arranged separately.', '항공권은 별도로 준비됩니다.'),
      },
      {
        question: text('Can dietary needs be accommodated?', '식이 요청이 가능한가요?'),
        answer: text('Yes, with advance notice.', '네, 사전에 알려주시면 가능합니다.'),
      },
    ],
    benefits: [
      {
        mark: text('Virtuoso Voyages', '버추오소 보야지'),
        title: text('Shipboard credit', '선상 크레딧'),
        desc: text('$300 credit per suite.', '스위트당 300달러 크레딧.'),
      },
    ],
    meta_title: null,
    meta_description: null,
    og_image: null,
    schema_version: 1,
  };
}

async function mockJourney(page: Page, requestedLanguages: string[]) {
  await page.route(`**/api/signature-journeys/${SLUG}**`, async (route: Route) => {
    const url = new URL(route.request().url());
    const language = url.searchParams.get('language') === 'kr' ? 'kr' : 'en';
    requestedLanguages.push(language);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: journeyFixture(language) }),
    });
  });
}

test.describe('/signature-journeys/[slug]', () => {
  test('renders every populated section and hides the empty Units section', async ({ page }) => {
    await mockJourney(page, []);
    await page.goto(`/signature-journeys/${SLUG}`);

    await expect(
      page.getByRole('heading', { level: 1, name: 'Grand Mediterranean Voyage' }),
    ).toBeVisible();

    // Populated sections render, in the new modular order.
    for (const section of [
      'journey-hero',
      'journey-about',
      'journey-highlights',
      'journey-routes',
      'journey-specs',
      'journey-inclusions',
      'journey-benefits',
      'journey-faq',
    ]) {
      await expect(page.locator(`[data-testid="${section}"]`)).toBeVisible();
    }

    // The fixture has no units — the section must not exist at all.
    await expect(page.locator('[data-testid="journey-units"]')).toHaveCount(0);

    // Spot-check section content.
    await expect(page.getByText('All-Suite Yacht')).toBeVisible();
    await expect(page.getByText('Barcelona — Palma — Ajaccio — Rome')).toBeVisible();
    await expect(page.getByText('298 guests')).toBeVisible();
    await expect(page.getByText('All gratuities')).toBeVisible();
    // Inline booking benefit card: mark eyebrow + title + desc.
    await expect(page.getByText('Virtuoso Voyages')).toBeVisible();
    await expect(page.getByText('Shipboard credit')).toBeVisible();

    // Concierge CTA links.
    await expect(page.getByRole('link', { name: 'Chat with Concierge' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Signature Journeys' })).toBeVisible();
  });

  test('FAQ accordion opens one item at a time', async ({ page }) => {
    await mockJourney(page, []);
    await page.goto(`/signature-journeys/${SLUG}`);

    const firstQuestion = page.getByRole('button', { name: 'Is airfare included?' });
    const secondQuestion = page.getByRole('button', {
      name: 'Can dietary needs be accommodated?',
    });

    // First item is open by default.
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Airfare is arranged separately.')).toBeVisible();

    // Opening the second closes the first.
    await secondQuestion.click();
    await expect(page.getByText('Yes, with advance notice.')).toBeVisible();
    await expect(page.getByText('Airfare is arranged separately.')).toHaveCount(0);

    // Clicking the open item closes it.
    await secondQuestion.click();
    await expect(page.getByText('Yes, with advance notice.')).toHaveCount(0);
  });

  test('language toggle re-fetches with kr and renders Korean content', async ({ page }) => {
    const requestedLanguages: string[] = [];
    await mockJourney(page, requestedLanguages);
    await page.goto(`/signature-journeys/${SLUG}`);

    // English first paint (Playwright's default locale is en-US).
    await expect(page.getByText('AT A GLANCE')).toBeVisible();

    // The header language toggle reads "KR" while in English.
    await page.getByTestId('desktop-nav').getByRole('button', { name: 'KR' }).click();

    // KR re-fetch + Korean copy (catalog header) and Korean data fields.
    await expect(page.getByText('한눈에 보기')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: '그랜드 지중해 항해' })).toBeVisible();
    expect(requestedLanguages).toContain('kr');
  });

  test('shows the not-found state for an unknown slug', async ({ page }) => {
    await page.route('**/api/signature-journeys/nope**', async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Signature journey not found' }),
      });
    });

    await page.goto('/signature-journeys/nope');

    await expect(page.getByText('Journey Not Found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Signature Journeys' })).toBeVisible();
  });
});
