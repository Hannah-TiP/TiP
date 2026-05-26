/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AmenityGrid from '@/components/hotel/AmenityGrid';
import type { HotelFeature } from '@/types/hotel';
import enTranslations from '@/translations/en.json';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => <img {...props} alt={props.alt} />,
}));

afterEach(() => cleanup());

const featureWithoutImages: HotelFeature = {
  feature_type: 'amenity',
  name: { en: 'Breakfast Included', kr: '조식 포함' },
  icon: '🍳',
};

const amenityWithImages: HotelFeature = {
  feature_type: 'amenity',
  name: { en: 'Airport Transfer', kr: '공항 셔틀' },
  icon: '🚗',
  images: [
    { original: 'https://example.com/transfer1.jpg' },
    { original: 'https://example.com/transfer2.jpg' },
  ],
};

const facilityWithImages: HotelFeature = {
  feature_type: 'facility',
  name: { en: 'Spa', kr: '스파' },
  icon: '♨️',
  images: [
    { original: 'https://example.com/spa1.jpg' },
    { original: 'https://example.com/spa2.jpg' },
    { original: 'https://example.com/spa3.jpg' },
  ],
};

describe('AmenityGrid', () => {
  it('renders one item per feature, including icon and localized name', () => {
    const features: HotelFeature[] = [
      { feature_type: 'amenity', name: { en: 'Spa', kr: '스파' }, icon: '♨️' },
      { feature_type: 'amenity', name: { en: 'Pool', kr: '수영장' }, icon: '🏊' },
      { feature_type: 'facility', name: { en: 'Gym', kr: '피트니스' } },
    ];
    render(<AmenityGrid features={features} />);

    expect(screen.getByText('Spa')).toBeTruthy();
    expect(screen.getByText('Pool')).toBeTruthy();
    expect(screen.getByText('Gym')).toBeTruthy();
    expect(screen.getByText('♨️')).toBeTruthy();
    expect(screen.getByText('🏊')).toBeTruthy();
  });

  it('image-less feature stays as plain non-interactive tile', () => {
    render(<AmenityGrid features={[featureWithoutImages]} />);

    expect(screen.getByText('Breakfast Included')).toBeTruthy();
    expect(screen.getByText('🍳')).toBeTruthy();

    // No button should exist for image-less features
    expect(screen.queryByRole('button', { name: /breakfast/i })).toBeNull();
    // No "View photos" text
    expect(screen.queryByText('View photos')).toBeNull();
  });

  it('image-bearing AMENITY renders as button and opens modal', () => {
    render(<AmenityGrid features={[amenityWithImages]} />);

    const button = screen.getByTestId('amenity-photo-button-0');
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
    expect(screen.getByText('Airport Transfer')).toBeTruthy();
    expect(screen.getByText('🚗')).toBeTruthy();
    expect(screen.getByText('View photos')).toBeTruthy();

    // Modal should not be open yet
    expect(screen.queryByTestId('modal-backdrop')).toBeNull();

    // Click the button to open the modal
    fireEvent.click(button);

    // Modal should now be open with the feature name as title
    expect(screen.getByTestId('modal-backdrop')).toBeTruthy();
    expect(screen.getByTestId('modal-dialog')).toBeTruthy();
    // The heading inside the modal
    const headings = screen.getAllByText('Airport Transfer');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('image-bearing FACILITY renders as button and opens modal', () => {
    render(<AmenityGrid features={[facilityWithImages]} />);

    const button = screen.getByTestId('amenity-photo-button-0');
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
    expect(screen.getByText('Spa')).toBeTruthy();
    expect(screen.getByText('♨️')).toBeTruthy();

    // Click to open modal
    fireEvent.click(button);

    expect(screen.getByTestId('modal-backdrop')).toBeTruthy();
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(3);
  });

  it('modal closes on ESC key', () => {
    render(<AmenityGrid features={[facilityWithImages]} />);

    const button = screen.getByTestId('amenity-photo-button-0');
    fireEvent.click(button);

    // Modal should be open
    expect(screen.getByTestId('modal-backdrop')).toBeTruthy();

    // Press ESC
    fireEvent.keyDown(window, { key: 'Escape' });

    // Modal should be closed
    expect(screen.queryByTestId('modal-backdrop')).toBeNull();
  });
});
