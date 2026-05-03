import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AmenityGrid from '@/components/hotel/AmenityGrid';
import type { HotelFeature } from '@/types/hotel';

afterEach(() => cleanup());

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
});
