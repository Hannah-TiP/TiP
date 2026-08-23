/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import MagazineIndexIsland from '@/components/magazine/MagazineIndexIsland';
import type { CropRect } from '@/types/common';
import type { MagazineArticle } from '@/types/magazine';

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/Footer', () => ({ default: () => null }));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    // Never resolves — facets stay null (selects fall back to empty options)
    // and no post-unmount state update fires.
    getMagazineFacets: vi.fn(() => new Promise(() => {})),
    getMagazineArticles: vi.fn(),
  },
}));

// The list under test comes straight from the (mocked) infinite-list hook.
let listItems: MagazineArticle[] = [];

vi.mock('@/lib/use-infinite-list', () => ({
  useInfiniteList: () => ({
    items: listItems,
    total: listItems.length,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    sentinelRef: () => {},
  }),
}));

afterEach(() => cleanup());

const crop: CropRect = { x: 0.1, y: 0.2, width: 0.5, height: 0.5 };

function buildArticle(id: number, title: string, heroCrop?: CropRect): MagazineArticle {
  return {
    id,
    type: 'destination',
    slug: `article-${id}`,
    status: 'published',
    title: { en: title, kr: null },
    hero_image: { original: `https://cdn.example.com/${id}.jpg`, crop: heroCrop ?? null },
    tags: [],
    schema_version: 1,
    published_at: '2026-01-10T00:00:00Z',
  };
}

describe('MagazineIndexIsland — authored crop honoured on grid cards (SMA-306)', () => {
  it('renders the cropped frame when hero_image.crop is set', () => {
    listItems = [buildArticle(1, 'Cropped Story', crop)];
    render(<MagazineIndexIsland initialArticles={[]} />);
    const grid = screen.getByTestId('magazine-grid');
    const frame = within(grid).getByTestId('cropped-image-frame');
    expect(within(frame).getByAltText('Cropped Story')).toBeTruthy();
  });

  it('renders a plain full-frame image when there is no crop', () => {
    listItems = [buildArticle(2, 'Uncropped Story')];
    render(<MagazineIndexIsland initialArticles={[]} />);
    const grid = screen.getByTestId('magazine-grid');
    expect(within(grid).queryByTestId('cropped-image-frame')).toBeNull();
    expect(within(grid).getByAltText('Uncropped Story')).toBeTruthy();
  });
});
