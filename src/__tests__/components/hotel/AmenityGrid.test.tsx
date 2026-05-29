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

const featureWithDescription: HotelFeature = {
  feature_type: 'amenity',
  name: { en: 'Complimentary Breakfast', kr: '무료 조식' },
  description: {
    en: 'Freshly prepared daily with local ingredients',
    kr: '매일 신선한 현지 재료로 준비',
  },
  icon: '🍳',
};

const photoFeatureWithDescription: HotelFeature = {
  feature_type: 'facility',
  name: { en: 'Infinity Pool', kr: '인피니티 풀' },
  description: {
    en: 'Heated outdoor pool with panoramic city views',
    kr: '탁 트인 도시 전망의 온수 야외 수영장',
  },
  icon: '🏊',
  images: [
    { original: 'https://example.com/pool1.jpg' },
    { original: 'https://example.com/pool2.jpg' },
  ],
};

const featureWithNullDescription: HotelFeature = {
  feature_type: 'amenity',
  name: { en: 'Free WiFi', kr: '무료 와이파이' },
  description: null,
  icon: '📶',
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

  it('renders description in non-photo tile when description is present', () => {
    render(<AmenityGrid features={[featureWithDescription]} />);

    expect(screen.getByText('Complimentary Breakfast')).toBeTruthy();
    expect(screen.getByText('Freshly prepared daily with local ingredients')).toBeTruthy();
  });

  it('non-photo tile has title attribute with full description for tooltip', () => {
    render(<AmenityGrid features={[featureWithDescription]} />);

    const tile = screen.getByText('Complimentary Breakfast').closest('li');
    expect(tile).toBeTruthy();
    expect(tile!.getAttribute('title')).toBe('Freshly prepared daily with local ingredients');
  });

  it('renders description in photo-bearing tile when description is present', () => {
    render(<AmenityGrid features={[photoFeatureWithDescription]} />);

    expect(screen.getByText('Infinity Pool')).toBeTruthy();
    expect(screen.getByText('Heated outdoor pool with panoramic city views')).toBeTruthy();
  });

  it('shows full description in modal for photo-bearing feature', () => {
    render(<AmenityGrid features={[photoFeatureWithDescription]} />);

    const button = screen.getByTestId('amenity-photo-button-0');
    fireEvent.click(button);

    expect(screen.getByTestId('modal-dialog')).toBeTruthy();
    // Modal should show the description as a paragraph
    const modalDialog = screen.getByTestId('modal-dialog');
    const descriptionParagraph = modalDialog.querySelector('p');
    expect(descriptionParagraph).toBeTruthy();
    expect(descriptionParagraph!.textContent).toBe('Heated outdoor pool with panoramic city views');
  });

  it('omits description element when description is null', () => {
    render(<AmenityGrid features={[featureWithNullDescription]} />);

    expect(screen.getByText('Free WiFi')).toBeTruthy();
    expect(screen.getByText('📶')).toBeTruthy();
    // The tile should not contain any description-like span beyond the name
    const tile = screen.getByText('Free WiFi').closest('li');
    expect(tile).toBeTruthy();
    expect(tile!.getAttribute('title')).toBeNull();
    // Only one span inside: the icon and the name
    const spans = tile!.querySelectorAll('span');
    expect(spans.length).toBe(2); // icon + name, no description span
  });

  it('omits description element when description field is undefined', () => {
    render(<AmenityGrid features={[featureWithoutImages]} />);

    // featureWithoutImages has no description field
    const tile = screen.getByText('Breakfast Included').closest('li');
    expect(tile).toBeTruthy();
    expect(tile!.getAttribute('title')).toBeNull();
    const spans = tile!.querySelectorAll('span');
    expect(spans.length).toBe(2); // icon + name, no description span
  });

  it('modal omits description paragraph when feature has no description', () => {
    render(<AmenityGrid features={[facilityWithImages]} />);

    const button = screen.getByTestId('amenity-photo-button-0');
    fireEvent.click(button);

    expect(screen.getByTestId('modal-dialog')).toBeTruthy();
    const modalDialog = screen.getByTestId('modal-dialog');
    const descriptionParagraph = modalDialog.querySelector('p');
    expect(descriptionParagraph).toBeNull();
  });
});
