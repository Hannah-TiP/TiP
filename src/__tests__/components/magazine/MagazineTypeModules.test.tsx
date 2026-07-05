/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MagazineGuideSteps from '@/components/magazine/MagazineGuideSteps';
import MagazineTypeMeta from '@/components/magazine/MagazineTypeMeta';
import type { MagazineArticle, MagazineArticleDetail } from '@/types/magazine';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => <img {...props} alt={props.alt} />,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => cleanup());

function baseArticle(overrides: Partial<MagazineArticle> = {}): MagazineArticle {
  return {
    id: 1,
    type: 'guide',
    slug: 'kyoto-guide',
    status: 'published',
    title: { en: 'Kyoto Guide', kr: null },
    tags: [],
    schema_version: 1,
    published_at: '2026-01-10T00:00:00Z',
    ...overrides,
  };
}

function guideDetail(): MagazineArticleDetail {
  return {
    article: baseArticle({
      type: 'guide',
      type_payload: {
        steps: [
          { label: 'Day 1', title: { en: 'Arrive' }, body: { en: 'Rest up.' }, hotel_id: 100 },
          { label: 'Day 2', title: { en: 'Explore' }, body: { en: 'Walk.' }, hotel_id: null },
        ],
      },
    }),
    relations: [
      {
        id: 1,
        target_type: 'hotel',
        target_id: 100,
        kind: 'linked',
        position: 0,
        schema_version: 1,
        hotel: { id: 100, slug: 'aman-kyoto', name: { en: 'Aman Kyoto', kr: null } },
      },
    ],
    related: [],
    available_locales: ['en'],
  };
}

describe('MagazineGuideSteps', () => {
  it('renders each step with label/title/body and a hotel card for step hotels', () => {
    render(<MagazineGuideSteps detail={guideDetail()} />);
    const steps = screen.getAllByTestId('magazine-guide-step');
    expect(steps).toHaveLength(2);
    expect(within(steps[0]).getByText('Day 1')).toBeTruthy();
    expect(within(steps[0]).getByText('Arrive')).toBeTruthy();
    expect(within(steps[0]).getByText('Rest up.')).toBeTruthy();
    // Step 1 has a hotel → a hotel card resolves the linked relation slug.
    expect(within(steps[0]).getByTestId('magazine-hotel-card')).toBeTruthy();
    expect(within(steps[0]).getByTestId('magazine-hotel-cta').getAttribute('href')).toBe(
      '/hotel/aman-kyoto',
    );
    // Step 2 has no hotel → no card.
    expect(within(steps[1]).queryByTestId('magazine-hotel-card')).toBeNull();
  });

  it('renders nothing when the guide has no steps', () => {
    const detail = guideDetail();
    detail.article.type_payload = null;
    const { container } = render(<MagazineGuideSteps detail={detail} />);
    expect(container.querySelector('[data-testid="magazine-guide-steps"]')).toBeNull();
  });
});

describe('MagazineTypeMeta — News', () => {
  it('renders a visible dateline + category badge', () => {
    render(
      <MagazineTypeMeta
        article={baseArticle({ type: 'news', type_payload: { category: 'opening' } })}
        publishedLabel="January 10, 2026"
      />,
    );
    expect(screen.getByTestId('magazine-news-dateline').textContent).toContain('January 10, 2026');
    expect(screen.getByTestId('magazine-news-category').textContent).toBe('New opening');
  });

  it('renders the dateline even when the category is absent', () => {
    render(
      <MagazineTypeMeta
        article={baseArticle({ type: 'news', type_payload: null })}
        publishedLabel="January 10, 2026"
      />,
    );
    expect(screen.getByTestId('magazine-news-dateline')).toBeTruthy();
    expect(screen.queryByTestId('magazine-news-category')).toBeNull();
  });
});

describe('MagazineTypeMeta — Insider', () => {
  it('renders a topic badge only (NO byline)', () => {
    render(
      <MagazineTypeMeta
        article={baseArticle({ type: 'insider', type_payload: { topic: 'virtuoso' } })}
        publishedLabel="January 10, 2026"
      />,
    );
    expect(screen.getByTestId('magazine-insider-topic').textContent).toBe('Virtuoso');
    // No author / byline element.
    expect(screen.queryByText(/by /i)).toBeNull();
  });

  it('renders nothing for a non-news/insider type', () => {
    const { container } = render(
      <MagazineTypeMeta article={baseArticle({ type: 'guide' })} publishedLabel="X" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
