/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RestaurantCarousel from '@/components/ai-chat/widgets/RestaurantCarousel';
import { apiClient } from '@/lib/api-client';
import type { AIChatRestaurantCarouselWidget } from '@/types/ai-chat';
import type { Restaurant } from '@/types/restaurant';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
}));

vi.mock('@/components/restaurant/RestaurantDetailContent', () => ({
  default: ({ restaurant }: { restaurant: Restaurant }) => (
    <div data-testid="restaurant-detail-content">{restaurant.slug}</div>
  ),
}));

const WIDGET: AIChatRestaurantCarouselWidget = {
  widget_id: 'w-restaurants',
  widget_type: 'restaurant_carousel',
  restaurants: [
    {
      id: 20,
      name: 'La Pergola',
      image_url: null,
      description: null,
      recognitions: ['3 Stars'],
    },
    {
      id: 21,
      name: 'Noma',
      image_url: null,
      description: null,
      recognitions: [],
    },
  ],
};

const FAKE_RESTAURANT: Restaurant = {
  id: 20,
  slug: 'la-pergola',
  status: 'published',
  schema_version: 1,
  name: { en: 'La Pergola', kr: null },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

beforeEach(() => {
  vi.spyOn(apiClient, 'getRestaurantById').mockResolvedValue(FAKE_RESTAURANT);
});

describe('RestaurantCarousel modal preview flow', () => {
  it('clicking a card opens the preview modal but does NOT fire onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<RestaurantCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('restaurant-card-20'));

    await waitFor(() => {
      expect(screen.getByTestId('modal-dialog')).toBeDefined();
    });
    await waitFor(() => {
      expect(screen.getByTestId('restaurant-detail-content')).toBeDefined();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(apiClient.getRestaurantById).toHaveBeenCalledWith(20);
  });

  it('closing the modal via Cancel does NOT fire onSubmit and keeps the carousel active', async () => {
    const onSubmit = vi.fn();
    render(<RestaurantCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('restaurant-card-20'));
    await waitFor(() => screen.getByTestId('restaurant-preview-cancel'));

    fireEvent.click(screen.getByTestId('restaurant-preview-cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    expect(onSubmit).not.toHaveBeenCalled();

    const otherCard = screen.getByTestId('restaurant-card-21');
    expect(otherCard.hasAttribute('disabled')).toBe(false);
  });

  it('closing the modal via ESC does NOT fire onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<RestaurantCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('restaurant-card-20'));
    await waitFor(() => screen.getByTestId('modal-dialog'));

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Select this restaurant" fires onSubmit with the exact payload shape and disables the carousel', async () => {
    const onSubmit = vi.fn();
    render(<RestaurantCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('restaurant-card-20'));
    await waitFor(() => screen.getByTestId('restaurant-preview-confirm'));

    fireEvent.click(screen.getByTestId('restaurant-preview-confirm'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-restaurants',
      widget_type: 'restaurant_carousel',
      value: { restaurant_id: 20, name: 'La Pergola' },
    });

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    expect(screen.getByTestId('restaurant-card-20').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('restaurant-card-21').hasAttribute('disabled')).toBe(true);
  });

  it('shows an error state and a Close button when the fetch fails', async () => {
    vi.spyOn(apiClient, 'getRestaurantById').mockRejectedValueOnce(new Error('boom'));

    const onSubmit = vi.fn();
    render(<RestaurantCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('restaurant-card-20'));

    await waitFor(() => {
      expect(screen.getByTestId('restaurant-preview-error')).toBeDefined();
    });

    expect(screen.queryByTestId('restaurant-detail-content')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
