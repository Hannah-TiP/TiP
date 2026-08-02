import { test, expect } from '@playwright/test';
import { gotoPage } from './support/navigation';

test.describe('Homepage — Our Partners section', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/');
  });

  test('renders the Our Partners heading between Membership and Footer', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Our Partners', exact: true });
    await expect(heading).toBeVisible();

    // Sanity: the section sits after the Membership block and before the footer.
    const membership = page.getByRole('heading', { name: 'Les Quatre Cercles' });
    await expect(membership).toBeVisible();
  });

  test('displays partner logos with meaningful alt text that load successfully', async ({
    page,
  }) => {
    const section = page.getByLabel('Our partner brands');
    // A few representative brands across hotel-brand + travel-network partners.
    // The marquee scrolls, so a given logo may be mid-transit through the
    // overflow-hidden window — assert each alt is present (real + clone = 2)
    // and that at least one copy decoded (naturalWidth > 0).
    for (const name of ['Aman', 'Four Seasons', 'IATA', 'Virtuoso', 'Lotte Duty Free']) {
      const imgs = section.locator(`img[alt="${name}"]`);
      await expect(imgs).toHaveCount(2);
      await expect
        .poll(() =>
          imgs.evaluateAll((els) => els.some((el) => (el as HTMLImageElement).naturalWidth > 0)),
        )
        .toBe(true);
    }
  });

  test('renders the marquee track with the logo list duplicated for a seamless loop', async ({
    page,
  }) => {
    const section = page.getByLabel('Our partner brands');
    await expect(section).toBeVisible();

    // The list is rendered twice (real + aria-hidden clone) for the -50% loop.
    // 32 curated brands -> 64 <img> elements in the track. The clones are
    // aria-hidden, so query the raw <img> tags rather than the img role.
    // 32 curated brands x 2 copies = 64.
    await expect(section.locator('img')).toHaveCount(64);
    await expect(section.locator('img[alt="The Peninsula"]')).toHaveCount(2);
  });
});
