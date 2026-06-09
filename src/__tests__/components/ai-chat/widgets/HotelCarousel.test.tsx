/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HotelCarousel from '@/components/ai-chat/widgets/HotelCarousel';
import { apiClient } from '@/lib/api-client';
import type { AIChatHotelCarouselWidget } from '@/types/ai-chat';
import type { Hotel } from '@/types/hotel';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} alt={props.alt} />
  ),
}));

// HotelDetailContent pulls in LanguageContext + a handful of subcomponents
// that aren't relevant to the carousel's modal-flow contract; stub it.
vi.mock('@/components/hotel/HotelDetailContent', () => ({
  default: ({ hotel }: { hotel: Hotel }) => (
    <div data-testid="hotel-detail-content">{hotel.slug}</div>
  ),
}));

const WIDGET: AIChatHotelCarouselWidget = {
  widget_id: 'w-hotels',
  widget_type: 'hotel_carousel',
  hotels: [
    { id: 100, name: 'Ritz Paris', image_url: null, overview: null, benefits: [] },
    { id: 101, name: 'Four Seasons', image_url: null, overview: null, benefits: [] },
  ],
};

const FAKE_HOTEL: Hotel = {
  id: 100,
  slug: 'ritz-paris',
  status: 'published',
  schema_version: 1,
  name: { en: 'Ritz Paris', kr: null },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

beforeEach(() => {
  vi.spyOn(apiClient, 'getHotelById').mockResolvedValue(FAKE_HOTEL);
});

describe('HotelCarousel modal preview flow', () => {
  it('clicking a card opens the preview modal but does NOT fire onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));

    await waitFor(() => {
      expect(screen.getByTestId('modal-dialog')).toBeDefined();
    });
    await waitFor(() => {
      expect(screen.getByTestId('hotel-detail-content')).toBeDefined();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(apiClient.getHotelById).toHaveBeenCalledWith(100);
  });

  it('closing the modal via Cancel does NOT fire onSubmit and keeps the carousel active', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('hotel-preview-cancel'));

    fireEvent.click(screen.getByTestId('hotel-preview-cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    expect(onSubmit).not.toHaveBeenCalled();

    // Carousel is still clickable — another card click re-opens the modal.
    const otherCard = screen.getByTestId('hotel-card-101');
    expect(otherCard.hasAttribute('disabled')).toBe(false);
  });

  it('closing the modal via ESC does NOT fire onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('modal-dialog'));

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Select this hotel" fires onSubmit with the exact payload shape and disables the carousel', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('hotel-preview-confirm'));

    fireEvent.click(screen.getByTestId('hotel-preview-confirm'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-hotels',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100, name: 'Ritz Paris' },
    });

    // Modal closes after confirm.
    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    // Carousel is disabled after a selection (selectedId set).
    expect(screen.getByTestId('hotel-card-100').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('hotel-card-101').hasAttribute('disabled')).toBe(true);
  });

  it('"Add & choose another" accumulates a chip and leaves the carousel active without firing onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('hotel-preview-add-another'));

    fireEvent.click(screen.getByTestId('hotel-preview-add-another'));

    // Modal closes, no submit yet, a chip appears, the chosen card is disabled.
    await waitFor(() => {
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('hotel-chip-100')).toBeDefined();
    expect(screen.getByTestId('hotel-card-100').hasAttribute('disabled')).toBe(true);
    // Other card still selectable.
    expect(screen.getByTestId('hotel-card-101').hasAttribute('disabled')).toBe(false);
  });

  it('submits a { hotels: [...] } array when finishing after adding another', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    // Pick hotel 100 -> Add another.
    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('hotel-preview-add-another'));
    fireEvent.click(screen.getByTestId('hotel-preview-add-another'));
    await waitFor(() => screen.queryByTestId('modal-dialog') === null);

    // Pick hotel 101 -> Select this hotel (finish).
    fireEvent.click(screen.getByTestId('hotel-card-101'));
    await waitFor(() => screen.getByTestId('hotel-preview-confirm'));
    fireEvent.click(screen.getByTestId('hotel-preview-confirm'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-hotels',
      widget_type: 'hotel_carousel',
      value: {
        hotels: [
          { hotel_id: 100, name: 'Ritz Paris' },
          { hotel_id: 101, name: 'Four Seasons' },
        ],
      },
    });
  });

  it('removing a chip de-selects the hotel and re-enables its card', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('hotel-preview-add-another'));
    fireEvent.click(screen.getByTestId('hotel-preview-add-another'));
    await waitFor(() => screen.getByTestId('hotel-chip-100'));

    expect(screen.getByTestId('hotel-card-100').hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByTestId('hotel-chip-remove-100'));

    await waitFor(() => {
      expect(screen.queryByTestId('hotel-chip-100')).toBeNull();
    });
    expect(screen.getByTestId('hotel-card-100').hasAttribute('disabled')).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('a single pick (no "Add another") still emits the single { hotel_id, name } shape', async () => {
    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));
    await waitFor(() => screen.getByTestId('hotel-preview-confirm'));
    fireEvent.click(screen.getByTestId('hotel-preview-confirm'));

    expect(onSubmit).toHaveBeenCalledWith({
      widget_id: 'w-hotels',
      widget_type: 'hotel_carousel',
      value: { hotel_id: 100, name: 'Ritz Paris' },
    });
  });

  it('shows an error state and a Close button when the fetch fails', async () => {
    vi.spyOn(apiClient, 'getHotelById').mockRejectedValueOnce(new Error('boom'));

    const onSubmit = vi.fn();
    render(<HotelCarousel widget={WIDGET} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('hotel-card-100'));

    await waitFor(() => {
      expect(screen.getByTestId('hotel-preview-error')).toBeDefined();
    });

    expect(screen.queryByTestId('hotel-detail-content')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
