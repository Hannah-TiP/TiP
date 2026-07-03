/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JourneyHighlights from '@/components/signature-journey/JourneyHighlights';
import JourneyUnits from '@/components/signature-journey/JourneyUnits';
import JourneyRoutes from '@/components/signature-journey/JourneyRoutes';
import JourneySpecs from '@/components/signature-journey/JourneySpecs';
import JourneyInclusions from '@/components/signature-journey/JourneyInclusions';
import JourneyBenefits from '@/components/signature-journey/JourneyBenefits';
import { toFaqItems } from '@/types/signatureJourney';

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

describe('JourneyHighlights', () => {
  it('renders each highlight card with title and desc', () => {
    render(
      <JourneyHighlights
        highlights={[
          { title: { en: 'All-Suite Yacht' }, desc: { en: 'Every suite has a terrace.' } },
          { title: { en: 'Michelin Dining' }, desc: { en: 'S.E.A. by Sven Elverfeld.' } },
        ]}
      />,
    );

    expect(screen.getByTestId('journey-highlights')).toBeTruthy();
    expect(screen.getByText('All-Suite Yacht')).toBeTruthy();
    expect(screen.getByText('S.E.A. by Sven Elverfeld.')).toBeTruthy();
    // Section header comes from the i18n catalog.
    expect(screen.getByText('What Makes It Extraordinary')).toBeTruthy();
  });

  it('renders nothing for an empty array', () => {
    render(<JourneyHighlights highlights={[]} />);
    expect(screen.queryByTestId('journey-highlights')).toBeNull();
  });

  it('renders nothing when every item is textless', () => {
    render(<JourneyHighlights highlights={[{}, { title: null, desc: null }]} />);
    expect(screen.queryByTestId('journey-highlights')).toBeNull();
  });
});

describe('JourneyUnits', () => {
  it('renders unit cards with image, spec eyebrow, name and desc', () => {
    render(
      <JourneyUnits
        units={[
          {
            image: { original: 'https://example.com/suite.jpg' },
            name: { en: 'Grand Suite' },
            spec: { en: '90 m² · Terrace' },
            desc: { en: 'The largest suite aboard.' },
          },
        ]}
      />,
    );

    expect(screen.getByTestId('journey-units')).toBeTruthy();
    expect(screen.getByText('Grand Suite')).toBeTruthy();
    expect(screen.getByText('90 m² · Terrace')).toBeTruthy();
    expect(screen.getByText('The largest suite aboard.')).toBeTruthy();
    expect(screen.getByAltText('Grand Suite')).toBeTruthy();
  });

  it('renders nothing when there are no meaningful units', () => {
    render(<JourneyUnits units={[{}]} />);
    expect(screen.queryByTestId('journey-units')).toBeNull();
  });
});

describe('JourneyRoutes', () => {
  it('renders route cards with region, title, stops and meta', () => {
    render(
      <JourneyRoutes
        routes={[
          {
            region: { en: 'Mediterranean' },
            title: { en: 'Barcelona to Rome' },
            stops: { en: 'Barcelona — Palma — Ajaccio — Rome' },
            meta: { en: '7 nights' },
            map_image: { original: 'https://example.com/map.jpg' },
          },
        ]}
      />,
    );

    expect(screen.getByTestId('journey-routes')).toBeTruthy();
    expect(screen.getByText('Mediterranean')).toBeTruthy();
    expect(screen.getByText('Barcelona to Rome')).toBeTruthy();
    expect(screen.getByText('Barcelona — Palma — Ajaccio — Rome')).toBeTruthy();
    expect(screen.getByText('7 nights')).toBeTruthy();
    expect(screen.getByAltText('Barcelona to Rome')).toBeTruthy();
  });

  it('renders a route without a map image', () => {
    render(<JourneyRoutes routes={[{ title: { en: 'Caribbean Loop' } }]} />);
    expect(screen.getByText('Caribbean Loop')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders nothing for an empty array', () => {
    render(<JourneyRoutes routes={[]} />);
    expect(screen.queryByTestId('journey-routes')).toBeNull();
  });
});

describe('JourneySpecs', () => {
  it('renders key/value pairs', () => {
    render(
      <JourneySpecs
        specs={[
          { key: { en: 'Duration' }, value: { en: '7–10 nights' } },
          { key: { en: 'Capacity' }, value: { en: '298 guests' } },
        ]}
      />,
    );

    expect(screen.getByTestId('journey-specs')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText('298 guests')).toBeTruthy();
    // "At a glance" header from the catalog.
    expect(screen.getByText('AT A GLANCE')).toBeTruthy();
  });

  it('renders nothing when every spec is empty', () => {
    render(<JourneySpecs specs={[{}, { key: null, value: null }]} />);
    expect(screen.queryByTestId('journey-specs')).toBeNull();
  });
});

describe('JourneyInclusions', () => {
  it('renders one row per inclusion, skipping empty items', () => {
    render(
      <JourneyInclusions
        inclusions={[
          { item: { en: 'All gratuities' } },
          {},
          { item: { en: 'Wi-Fi throughout the voyage' } },
        ]}
      />,
    );

    expect(screen.getByTestId('journey-inclusions')).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBe(2);
    expect(screen.getByText('All gratuities')).toBeTruthy();
  });

  it('renders nothing for an empty array', () => {
    render(<JourneyInclusions inclusions={[]} />);
    expect(screen.queryByTestId('journey-inclusions')).toBeNull();
  });
});

describe('JourneyBenefits', () => {
  it('renders benefit cards with mark eyebrow, title and desc', () => {
    render(
      <JourneyBenefits
        benefits={[
          {
            mark: { en: 'Virtuoso Voyages' },
            title: { en: 'Shipboard credit' },
            desc: { en: '$300 credit per suite.' },
          },
        ]}
      />,
    );

    expect(screen.getByTestId('journey-benefits')).toBeTruthy();
    expect(screen.getByText('Virtuoso Voyages')).toBeTruthy();
    expect(screen.getByText('Shipboard credit')).toBeTruthy();
    expect(screen.getByText('$300 credit per suite.')).toBeTruthy();
  });

  it('renders nothing when every benefit is empty', () => {
    render(<JourneyBenefits benefits={[{}]} />);
    expect(screen.queryByTestId('journey-benefits')).toBeNull();
  });
});

describe('toFaqItems', () => {
  it('drops items without a question and defaults a missing answer', () => {
    const items = toFaqItems([
      { question: { en: 'Is airfare included?' }, answer: { en: 'No.' } },
      { question: null, answer: { en: 'Orphan answer' } },
      { question: { en: 'Visa help?' } },
    ]);

    expect(items).toEqual([
      { question: { en: 'Is airfare included?' }, answer: { en: 'No.' } },
      { question: { en: 'Visa help?' }, answer: {} },
    ]);
  });

  it('returns an empty array for null/undefined input', () => {
    expect(toFaqItems(null)).toEqual([]);
    expect(toFaqItems(undefined)).toEqual([]);
  });
});
