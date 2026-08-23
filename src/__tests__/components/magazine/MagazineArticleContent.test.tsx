/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';
import MagazineArticleContent, {
  classifyCtaButtonUrl,
} from '@/components/magazine/MagazineArticleContent';
import type { BodyBlock, MagazineArticle, MagazineArticleDetail } from '@/types/magazine';

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

vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/magazine/MagazineRelationSections', () => ({ default: () => null }));
vi.mock('@/components/magazine/MagazineGuideSteps', () => ({ default: () => null }));
vi.mock('@/components/magazine/MagazineTypeMeta', () => ({ default: () => null }));
vi.mock('@/components/hotel/FaqAccordion', () => ({ default: () => null }));

let currentLang: 'en' | 'kr' = 'en';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ((currentLang === 'en' ? enTranslations : krTranslations) as Record<string, string>)[key] ??
      key,
    lang: currentLang,
    setLang: () => {},
  }),
}));

beforeEach(() => {
  currentLang = 'en';
});

afterEach(() => cleanup());

function buildDetail(body: BodyBlock[]): MagazineArticleDetail {
  const article: MagazineArticle = {
    id: 1,
    type: 'destination',
    slug: 'best-hotels-in-japan',
    status: 'published',
    title: { en: 'Best Hotels in Japan', kr: '일본 베스트 호텔' },
    body,
    tags: [],
    schema_version: 1,
    published_at: '2026-01-10T00:00:00Z',
  };
  return { article, relations: [], related: [], available_locales: ['en', 'kr'] };
}

const ctaWithButton: BodyBlock = {
  type: 'cta',
  heading: { en: 'Plan your escape', kr: '여행을 계획하세요' },
  text: { en: 'Our concierge is standing by.', kr: '컨시어지가 대기 중입니다.' },
  button_label: { en: 'Talk to the concierge', kr: '컨시어지와 상담하기' },
  button_url: '/concierge',
};

const ctaWithoutButton: BodyBlock = {
  type: 'cta',
  heading: { en: 'Plan your escape', kr: null },
  text: { en: 'Our concierge is standing by.', kr: null },
};

describe('MagazineArticleContent — cta block button (SMA-266)', () => {
  it('renders an internal button URL as a link with the authored href + label', () => {
    render(<MagazineArticleContent detail={buildDetail([ctaWithButton])} />);
    const button = screen.getByTestId('magazine-cta-button');
    expect(button.getAttribute('href')).toBe('/concierge');
    expect(button.textContent).toBe('Talk to the concierge');
    // Internal link — no new-tab attributes.
    expect(button.getAttribute('target')).toBeNull();
  });

  it('renders an external button URL with target=_blank and rel=noopener', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([{ ...ctaWithButton, button_url: 'https://example.com/book' }])}
      />,
    );
    const button = screen.getByTestId('magazine-cta-button');
    expect(button.getAttribute('href')).toBe('https://example.com/book');
    expect(button.getAttribute('target')).toBe('_blank');
    expect(button.getAttribute('rel')).toBe('noopener');
  });

  it('renders the KR button label in KR mode', () => {
    currentLang = 'kr';
    render(<MagazineArticleContent detail={buildDetail([ctaWithButton])} />);
    expect(screen.getByTestId('magazine-cta-button').textContent).toBe('컨시어지와 상담하기');
  });

  it('suppresses the footer Concierge CTA when an authored cta button exists', () => {
    render(<MagazineArticleContent detail={buildDetail([ctaWithButton])} />);
    expect(screen.queryByTestId('magazine-footer-cta')).toBeNull();
  });

  it('renders a cta block without button fields as heading + text only, keeping the footer CTA', () => {
    render(<MagazineArticleContent detail={buildDetail([ctaWithoutButton])} />);
    // Legacy output: heading + text, no in-body button.
    expect(screen.getByText('Plan your escape')).toBeTruthy();
    expect(screen.getByText('Our concierge is standing by.')).toBeTruthy();
    expect(screen.queryByTestId('magazine-cta-button')).toBeNull();
    // The generic footer CTA is unchanged and links to /concierge.
    const footer = screen.getByTestId('magazine-footer-cta');
    const footerLink = footer.querySelector('a');
    expect(footerLink?.getAttribute('href')).toBe('/concierge');
    expect(footerLink?.textContent).toBe(
      (enTranslations as Record<string, string>)['magazine.cta_button'],
    );
  });

  it('renders no button but keeps the footer CTA when the URL is set and the label is empty in both locales', () => {
    // Suppression keys on the SAME predicate as button visibility — a URL
    // without a label must not strip the article of every CTA.
    render(
      <MagazineArticleContent
        detail={buildDetail([{ ...ctaWithoutButton, button_url: '/concierge' }])}
      />,
    );
    expect(screen.queryByTestId('magazine-cta-button')).toBeNull();
    expect(screen.getByTestId('magazine-footer-cta')).toBeTruthy();
  });

  it.each(['javascript:alert(1)', 'data:text/html,evil'])(
    'treats a %s URL as no button and keeps the footer CTA (stored-XSS hardening)',
    (url) => {
      render(
        <MagazineArticleContent detail={buildDetail([{ ...ctaWithButton, button_url: url }])} />,
      );
      expect(screen.queryByTestId('magazine-cta-button')).toBeNull();
      expect(screen.getByTestId('magazine-footer-cta')).toBeTruthy();
    },
  );

  it('does not treat a protocol-relative //host URL as internal — no button, footer CTA kept', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([{ ...ctaWithButton, button_url: '//evil.com/phish' }])}
      />,
    );
    // Not internal (would leave the site via a next/link), not http(s) either
    // -> classifier says none: no button at all.
    expect(screen.queryByTestId('magazine-cta-button')).toBeNull();
    expect(screen.getByTestId('magazine-footer-cta')).toBeTruthy();
  });

  it('does not render a button for a relative (non-slash) URL', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([{ ...ctaWithButton, button_url: 'concierge' }])}
      />,
    );
    expect(screen.queryByTestId('magazine-cta-button')).toBeNull();
    expect(screen.getByTestId('magazine-footer-cta')).toBeTruthy();
  });
});

describe('MagazineArticleContent — renderer parity (SMA-306)', () => {
  const imageA = { original: 'https://cdn.example.com/a.jpg', alt: { en: 'Photo A', kr: null } };
  const imageB = { original: 'https://cdn.example.com/b.jpg', alt: { en: 'Photo B', kr: null } };

  it('renders every image in a gallery block images[] plus its heading and text', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([
          {
            type: 'gallery',
            heading: { en: 'The suites', kr: '스위트' },
            text: { en: 'A look inside.', kr: '내부 모습.' },
            images: [imageA, imageB],
          },
        ])}
      />,
    );
    const gallery = screen.getByTestId('magazine-gallery');
    expect(gallery.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'The suites' })).toBeTruthy();
    expect(screen.getByText('A look inside.')).toBeTruthy();
  });

  it('renders gallery tiles at 16:9 to match the admin crop lock', () => {
    render(
      <MagazineArticleContent detail={buildDetail([{ type: 'gallery', images: [imageA] }])} />,
    );
    const tile = screen.getByTestId('magazine-gallery').querySelector('div.relative');
    expect(tile?.className).toContain('aspect-video');
    expect(tile?.className).not.toContain('aspect-[4/3]');
  });

  it('heals a gallery block whose images[] is empty by rendering block.image as a single-item gallery', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([{ type: 'gallery', images: [], image: imageA }])}
      />,
    );
    const gallery = screen.getByTestId('magazine-gallery');
    expect(gallery.querySelectorAll('img')).toHaveLength(1);
    expect(gallery.querySelector('img')?.getAttribute('src')).toBe(imageA.original);
  });

  it('renders nothing for a gallery block with neither images[] nor image', () => {
    render(<MagazineArticleContent detail={buildDetail([{ type: 'gallery' }])} />);
    expect(screen.queryByTestId('magazine-gallery')).toBeNull();
  });

  it('renders an image block heading as a visible heading while keeping the alt fallback', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([
          {
            type: 'image',
            heading: { en: 'The lobby', kr: '로비' },
            image: { original: 'https://cdn.example.com/lobby.jpg' },
          },
        ])}
      />,
    );
    expect(screen.getByRole('heading', { name: 'The lobby' })).toBeTruthy();
    // No image alt authored — the heading still backs the alt text.
    expect(screen.getByAltText('The lobby')).toBeTruthy();
  });

  it('renders a callout as a tinted panel distinct from body copy', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([
          {
            type: 'callout',
            heading: { en: 'Good to know', kr: '알아두세요' },
            text: { en: 'Suites book out early.', kr: '스위트는 일찍 마감됩니다.' },
          },
        ])}
      />,
    );
    const callout = screen.getByTestId('magazine-callout');
    expect(callout.className).toContain('bg-gold/10');
    expect(screen.getByText('Suites book out early.')).toBeTruthy();
  });

  it('keeps the first data row of a comparison table authored WITHOUT a separator row', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([
          {
            type: 'comparison_table',
            heading: { en: 'Compare', kr: null },
            text: {
              en: '| Hotel | Price |\n| Aman Tokyo | $$$ |\n| Park Hyatt | $$ |',
              kr: null,
            },
          },
        ])}
      />,
    );
    expect(screen.getByText('Aman Tokyo')).toBeTruthy();
    expect(screen.getByText('Park Hyatt')).toBeTruthy();
  });

  it('still drops a markdown |---|:---:| separator row', () => {
    render(
      <MagazineArticleContent
        detail={buildDetail([
          {
            type: 'comparison_table',
            heading: { en: 'Compare', kr: null },
            text: {
              en: '| Hotel | Price |\n| --- | :---: |\n| Aman Tokyo | $$$ |',
              kr: null,
            },
          },
        ])}
      />,
    );
    expect(screen.getByText('Aman Tokyo')).toBeTruthy();
    expect(screen.queryByText('---')).toBeNull();
    expect(screen.queryByText(':---:')).toBeNull();
  });
});

describe('classifyCtaButtonUrl', () => {
  it('classifies per the allowlist', () => {
    expect(classifyCtaButtonUrl('/concierge')).toBe('internal');
    expect(classifyCtaButtonUrl('/')).toBe('internal');
    expect(classifyCtaButtonUrl('https://example.com')).toBe('external');
    expect(classifyCtaButtonUrl('http://example.com')).toBe('external');
    expect(classifyCtaButtonUrl('//evil.com')).toBe('none');
    expect(classifyCtaButtonUrl('javascript:alert(1)')).toBe('none');
    expect(classifyCtaButtonUrl('data:text/html,x')).toBe('none');
    expect(classifyCtaButtonUrl('mailto:x@y.com')).toBe('none');
    expect(classifyCtaButtonUrl('concierge')).toBe('none');
    expect(classifyCtaButtonUrl('')).toBe('none');
    expect(classifyCtaButtonUrl(null)).toBe('none');
    expect(classifyCtaButtonUrl(undefined)).toBe('none');
  });
});
