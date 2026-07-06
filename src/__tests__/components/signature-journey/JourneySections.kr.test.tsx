/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import JourneyHighlights from '@/components/signature-journey/JourneyHighlights';
import JourneyUnits from '@/components/signature-journey/JourneyUnits';
import JourneyRoutes from '@/components/signature-journey/JourneyRoutes';
import JourneySpecs from '@/components/signature-journey/JourneySpecs';
import JourneyInclusions from '@/components/signature-journey/JourneyInclusions';
import JourneyBenefits from '@/components/signature-journey/JourneyBenefits';

const krCatalog = kr as Record<string, string>;

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'kr' as const,
    setLang: vi.fn(),
    t: (key: string) => krCatalog[key] ?? key,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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

afterEach(() => cleanup());

describe('Journey sections (KR)', () => {
  it('JourneyHighlights renders the Korean title and desc', () => {
    render(
      <JourneyHighlights
        highlights={[
          {
            title: { en: 'All-Suite Yacht', kr: '올스위트 요트' },
            desc: { en: 'Terraces.', kr: '테라스.' },
          },
        ]}
      />,
    );
    expect(screen.getByText('올스위트 요트')).toBeTruthy();
    expect(screen.getByText('테라스.')).toBeTruthy();
    expect(screen.queryByText('All-Suite Yacht')).toBeNull();
  });

  it('JourneyUnits renders the Korean name, spec, desc and image alt', () => {
    render(
      <JourneyUnits
        units={[
          {
            image: {
              original: 'https://example.com/suite.jpg',
              alt: { en: 'Suite', kr: '스위트 사진' },
            },
            name: { en: 'Grand Suite', kr: '그랜드 스위트' },
            spec: { en: '90 m²', kr: '90 m² · 테라스' },
            desc: { en: 'The largest suite.', kr: '가장 큰 스위트.' },
          },
        ]}
      />,
    );
    expect(screen.getByText('그랜드 스위트')).toBeTruthy();
    expect(screen.getByText('90 m² · 테라스')).toBeTruthy();
    expect(screen.getByText('가장 큰 스위트.')).toBeTruthy();
    expect(screen.getByAltText('스위트 사진')).toBeTruthy();
    expect(screen.queryByText('Grand Suite')).toBeNull();
  });

  it('JourneyRoutes renders the Korean region/title/stops/meta and map alt', () => {
    render(
      <JourneyRoutes
        routes={[
          {
            region: { en: 'Mediterranean', kr: '지중해' },
            title: { en: 'Barcelona to Rome', kr: '바르셀로나에서 로마' },
            stops: { en: 'Barcelona — Rome', kr: '바르셀로나 — 로마' },
            meta: { en: '7 nights', kr: '7박' },
            map_image: { original: 'https://example.com/map.jpg', alt: { en: 'Map', kr: '지도' } },
          },
        ]}
      />,
    );
    expect(screen.getByText('지중해')).toBeTruthy();
    expect(screen.getByText('바르셀로나에서 로마')).toBeTruthy();
    expect(screen.getByText('바르셀로나 — 로마')).toBeTruthy();
    expect(screen.getByText('7박')).toBeTruthy();
    expect(screen.getByAltText('지도')).toBeTruthy();
    expect(screen.queryByText('Barcelona to Rome')).toBeNull();
  });

  it('JourneySpecs renders the Korean key and value', () => {
    render(
      <JourneySpecs
        specs={[{ key: { en: 'Duration', kr: '기간' }, value: { en: '7 nights', kr: '7박' } }]}
      />,
    );
    expect(screen.getByText('기간')).toBeTruthy();
    expect(screen.getByText('7박')).toBeTruthy();
    expect(screen.queryByText('Duration')).toBeNull();
  });

  it('JourneyInclusions renders the Korean item', () => {
    render(
      <JourneyInclusions inclusions={[{ item: { en: 'All gratuities', kr: '모든 팁 포함' } }]} />,
    );
    expect(screen.getByText('모든 팁 포함')).toBeTruthy();
    expect(screen.queryByText('All gratuities')).toBeNull();
  });

  it('JourneyBenefits renders the Korean mark/title/desc', () => {
    render(
      <JourneyBenefits
        benefits={[
          {
            mark: { en: 'Virtuoso', kr: '비르투오소' },
            title: { en: 'Shipboard credit', kr: '선상 크레딧' },
            desc: { en: '$300 per suite.', kr: '스위트당 300달러.' },
          },
        ]}
      />,
    );
    expect(screen.getByText('비르투오소')).toBeTruthy();
    expect(screen.getByText('선상 크레딧')).toBeTruthy();
    expect(screen.getByText('스위트당 300달러.')).toBeTruthy();
    expect(screen.queryByText('Shipboard credit')).toBeNull();
  });
});
