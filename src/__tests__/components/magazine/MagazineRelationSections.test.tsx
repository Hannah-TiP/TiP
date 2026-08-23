/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MagazineHotelCard from '@/components/magazine/MagazineHotelCard';
import MagazineRelationSections from '@/components/magazine/MagazineRelationSections';
import type { CropRect } from '@/types/common';
import type { ExpandedArticleRelation, MagazineRelationArticleRef } from '@/types/magazine';

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

function rankedRelation(position: number, slug: string, nameEn: string): ExpandedArticleRelation {
  return {
    id: position * 10,
    target_type: 'hotel',
    target_id: position,
    kind: 'ranked',
    position,
    blurb: { en: `Blurb for ${nameEn}`, kr: null },
    schema_version: 1,
    hotel: { id: position, slug, name: { en: nameEn, kr: null } },
  };
}

function linkedRelation(slug: string, nameEn: string): ExpandedArticleRelation {
  return {
    id: 999,
    target_type: 'hotel',
    target_id: 999,
    kind: 'linked',
    position: 0,
    schema_version: 1,
    hotel: { id: 999, slug, name: { en: nameEn, kr: null } },
  };
}

function parentRelation(): ExpandedArticleRelation {
  return {
    id: 500,
    target_type: 'article',
    target_id: 500,
    kind: 'parent',
    position: 0,
    schema_version: 1,
    article: {
      id: 500,
      type: 'collection',
      slug: 'japan-cluster',
      title: { en: 'Japan Cluster', kr: null },
    },
  };
}

const relatedStory: MagazineRelationArticleRef = {
  id: 77,
  type: 'guide',
  slug: 'kyoto-guide',
  title: { en: 'Kyoto Guide', kr: null },
  hero_image: { original: 'https://cdn.example.com/kyoto.jpg' },
};

describe('MagazineRelationSections — ranked', () => {
  it('renders ranked hotels in position order with /hotel/{slug} CTA links', () => {
    // Provided OUT of order; the component must sort by position.
    render(
      <MagazineRelationSections
        relations={[
          rankedRelation(2, 'the-ritz-paris', 'The Ritz Paris'),
          rankedRelation(1, 'aman-tokyo', 'Aman Tokyo'),
        ]}
        related={[]}
      />,
    );

    const section = screen.getByTestId('magazine-ranked');
    const cards = within(section).getAllByTestId('magazine-hotel-card');
    expect(cards).toHaveLength(2);
    // Position order: Aman Tokyo (1) then Ritz Paris (2)
    expect(within(cards[0]).getByText('Aman Tokyo')).toBeTruthy();
    expect(within(cards[0]).getByTestId('magazine-hotel-rank').textContent).toBe('1');
    expect(within(cards[1]).getByText('The Ritz Paris')).toBeTruthy();
    expect(within(cards[1]).getByTestId('magazine-hotel-rank').textContent).toBe('2');

    const ctas = within(section).getAllByTestId('magazine-hotel-cta');
    expect(ctas[0].getAttribute('href')).toBe('/hotel/aman-tokyo');
    expect(ctas[1].getAttribute('href')).toBe('/hotel/the-ritz-paris');
    // Per-rank blurb rendered
    expect(within(cards[0]).getByText('Blurb for Aman Tokyo')).toBeTruthy();
  });

  it('renders CONTIGUOUS rank badges (1,2) even for non-contiguous stored positions', () => {
    // Stored positions 10 & 20 — the on-screen badge is the 1-based sorted index,
    // matching the ItemList JSON-LD `position` (parity guard, mirrors the
    // jsonld unit test).
    render(
      <MagazineRelationSections
        relations={[
          rankedRelation(20, 'bulgari-tokyo', 'Bulgari Tokyo'),
          rankedRelation(10, 'aman-kyoto', 'Aman Kyoto'),
        ]}
        related={[]}
      />,
    );
    const cards = within(screen.getByTestId('magazine-ranked')).getAllByTestId(
      'magazine-hotel-card',
    );
    // Sorted by stored position (10 then 20), badges are contiguous 1,2 — NOT 10,20.
    expect(within(cards[0]).getByText('Aman Kyoto')).toBeTruthy();
    expect(within(cards[0]).getByTestId('magazine-hotel-rank').textContent).toBe('1');
    expect(within(cards[1]).getByText('Bulgari Tokyo')).toBeTruthy();
    expect(within(cards[1]).getByTestId('magazine-hotel-rank').textContent).toBe('2');
  });

  it('ignores ranked relations whose expanded hotel target is missing', () => {
    const orphan: ExpandedArticleRelation = {
      id: 1,
      target_type: 'hotel',
      target_id: 1,
      kind: 'ranked',
      position: 1,
      schema_version: 1,
      hotel: null,
    };
    render(<MagazineRelationSections relations={[orphan]} related={[]} />);
    expect(screen.queryByTestId('magazine-ranked')).toBeNull();
  });
});

describe('MagazineRelationSections — linked', () => {
  it('renders linked hotels with /hotel/{slug} links and no rank badge', () => {
    render(
      <MagazineRelationSections
        relations={[linkedRelation('bulgari-tokyo', 'Bulgari Tokyo')]}
        related={[]}
      />,
    );
    const section = screen.getByTestId('magazine-linked');
    expect(within(section).getByTestId('magazine-hotel-cta').getAttribute('href')).toBe(
      '/hotel/bulgari-tokyo',
    );
    expect(within(section).queryByTestId('magazine-hotel-rank')).toBeNull();
  });
});

describe('MagazineRelationSections — related stories', () => {
  it('renders related stories from the related[] field with plural /magazine links', () => {
    render(<MagazineRelationSections relations={[]} related={[relatedStory]} />);
    const section = screen.getByTestId('magazine-related');
    const card = within(section).getByTestId('magazine-related-card');
    // guide → plural segment "guides"
    expect(card.getAttribute('href')).toBe('/magazine/guides/kyoto-guide');
    expect(within(card).getByText('Kyoto Guide')).toBeTruthy();
  });
});

describe('MagazineRelationSections — cluster up-link', () => {
  it('renders a parent up-link to the parent article (plural segment)', () => {
    render(<MagazineRelationSections relations={[parentRelation()]} related={[]} />);
    const uplink = screen.getByTestId('magazine-parent-uplink');
    // collection → "collections"
    expect(uplink.getAttribute('href')).toBe('/magazine/collections/japan-cluster');
    expect(uplink.textContent).toContain('Japan Cluster');
  });
});

describe('Magazine cards — authored crop honoured (SMA-306)', () => {
  const crop: CropRect = { x: 0.1, y: 0.2, width: 0.5, height: 0.5 };

  function hotelCardRelation(heroCrop?: CropRect): ExpandedArticleRelation {
    return {
      id: 1,
      target_type: 'hotel',
      target_id: 1,
      kind: 'ranked',
      position: 1,
      schema_version: 1,
      hotel: {
        id: 1,
        slug: 'aman-tokyo',
        name: { en: 'Aman Tokyo', kr: null },
        hero_image: { original: 'https://cdn.example.com/aman.jpg', crop: heroCrop ?? null },
      },
    };
  }

  it('MagazineHotelCard renders the cropped frame when hero_image.crop is set', () => {
    render(<MagazineHotelCard relation={hotelCardRelation(crop)} lang="en" rank={1} />);
    const card = screen.getByTestId('magazine-hotel-card');
    const frame = within(card).getByTestId('cropped-image-frame');
    // The image renders INSIDE the crop frame, not full-frame.
    expect(within(frame).getByAltText('Aman Tokyo')).toBeTruthy();
  });

  it('MagazineHotelCard renders a plain full-frame image when there is no crop', () => {
    render(<MagazineHotelCard relation={hotelCardRelation()} lang="en" rank={1} />);
    const card = screen.getByTestId('magazine-hotel-card');
    expect(within(card).queryByTestId('cropped-image-frame')).toBeNull();
    expect(within(card).getByAltText('Aman Tokyo')).toBeTruthy();
  });

  it('related-story card renders the cropped frame when hero_image.crop is set', () => {
    render(
      <MagazineRelationSections
        relations={[]}
        related={[
          { ...relatedStory, hero_image: { original: relatedStory.hero_image!.original, crop } },
        ]}
      />,
    );
    const card = screen.getByTestId('magazine-related-card');
    const frame = within(card).getByTestId('cropped-image-frame');
    expect(within(frame).getByAltText('Kyoto Guide')).toBeTruthy();
  });

  it('related-story card renders a plain full-frame image when there is no crop', () => {
    render(<MagazineRelationSections relations={[]} related={[relatedStory]} />);
    const card = screen.getByTestId('magazine-related-card');
    expect(within(card).queryByTestId('cropped-image-frame')).toBeNull();
    expect(within(card).getByAltText('Kyoto Guide')).toBeTruthy();
  });
});

describe('MagazineRelationSections — empty / forward-compat', () => {
  it('renders nothing when there are no relations and no related stories', () => {
    const { container } = render(<MagazineRelationSections relations={[]} related={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing (never crashes) on an unknown relation kind', () => {
    const unknown = {
      id: 1,
      target_type: 'hotel',
      target_id: 1,
      kind: 'mystery',
      position: 1,
      schema_version: 1,
      hotel: { id: 1, slug: 'x', name: { en: 'X', kr: null } },
    } as unknown as ExpandedArticleRelation;
    const { container } = render(<MagazineRelationSections relations={[unknown]} related={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
