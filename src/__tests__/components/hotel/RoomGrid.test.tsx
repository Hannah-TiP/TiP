/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RoomGrid from '@/components/hotel/RoomGrid';
import type { HotelRoom } from '@/types/hotel';

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

const FALLBACK = '/fallback.jpg';

const roomZeroImages: HotelRoom = {
  name: { en: 'Basic Room' },
  size_sqm: 25,
  summary: { en: 'A cozy room.' },
  images: [],
};

const roomOneImage: HotelRoom = {
  name: { en: 'Standard Suite' },
  size_sqm: 40,
  summary: { en: 'A lovely suite.' },
  images: [{ original: 'https://example.com/suite1.jpg' }],
};

const roomThreeImages: HotelRoom = {
  name: { en: 'Deluxe Room' },
  size_sqm: 55,
  summary: { en: 'An elegant room with views.' },
  images: [
    { original: 'https://example.com/deluxe1.jpg' },
    { original: 'https://example.com/deluxe2.jpg' },
    { original: 'https://example.com/deluxe3.jpg' },
  ],
};

const roomNullImages: HotelRoom = {
  name: { en: 'Null Room' },
  images: null,
};

describe('RoomGrid', () => {
  it('renders fallback image when room has 0 images', () => {
    render(<RoomGrid rooms={[roomZeroImages]} fallbackImage={FALLBACK} />);

    const img = screen.getByAltText('Basic Room');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe(FALLBACK);

    // No badge should be shown
    expect(screen.queryByTestId('room-photo-badge-0')).toBeNull();
  });

  it('renders fallback image when room has null images', () => {
    render(<RoomGrid rooms={[roomNullImages]} fallbackImage={FALLBACK} />);

    const img = screen.getByAltText('Null Room');
    expect(img.getAttribute('src')).toBe(FALLBACK);
    expect(screen.queryByTestId('room-photo-badge-0')).toBeNull();
  });

  it('renders single image without badge when room has 1 image', () => {
    render(<RoomGrid rooms={[roomOneImage]} fallbackImage={FALLBACK} />);

    const img = screen.getByAltText('Standard Suite');
    expect(img.getAttribute('src')).toBe('https://example.com/suite1.jpg');

    // No badge for single image
    expect(screen.queryByTestId('room-photo-badge-0')).toBeNull();
  });

  it('shows "View N photos" badge when room has 3+ images', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    const badge = screen.getByTestId('room-photo-badge-0');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('View 3 photos');
  });

  it('opens modal with all images when badge is clicked', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    // Modal not open yet
    expect(screen.queryByTestId('room-photo-modal')).toBeNull();

    const badge = screen.getByTestId('room-photo-badge-0');
    fireEvent.click(badge);

    // Modal should be open
    expect(screen.getByTestId('room-photo-modal')).toBeTruthy();
    expect(screen.getByTestId('modal-backdrop')).toBeTruthy();

    // Counter should show 1 / 3
    const counter = screen.getByTestId('room-photo-counter');
    expect(counter.textContent).toBe('1 / 3');

    // Room name should appear as heading in modal
    const headings = screen.getAllByText('Deluxe Room');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates forward with next button', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    fireEvent.click(screen.getByTestId('room-photo-badge-0'));

    const counter = screen.getByTestId('room-photo-counter');
    expect(counter.textContent).toBe('1 / 3');

    fireEvent.click(screen.getByTestId('room-photo-next'));
    expect(counter.textContent).toBe('2 / 3');

    fireEvent.click(screen.getByTestId('room-photo-next'));
    expect(counter.textContent).toBe('3 / 3');

    // Wraps around to first
    fireEvent.click(screen.getByTestId('room-photo-next'));
    expect(counter.textContent).toBe('1 / 3');
  });

  it('navigates backward with prev button', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    fireEvent.click(screen.getByTestId('room-photo-badge-0'));

    const counter = screen.getByTestId('room-photo-counter');
    expect(counter.textContent).toBe('1 / 3');

    // Wraps to last
    fireEvent.click(screen.getByTestId('room-photo-prev'));
    expect(counter.textContent).toBe('3 / 3');

    fireEvent.click(screen.getByTestId('room-photo-prev'));
    expect(counter.textContent).toBe('2 / 3');
  });

  it('navigates with ArrowRight and ArrowLeft keys', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    fireEvent.click(screen.getByTestId('room-photo-badge-0'));

    const counter = screen.getByTestId('room-photo-counter');
    expect(counter.textContent).toBe('1 / 3');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(counter.textContent).toBe('2 / 3');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(counter.textContent).toBe('3 / 3');

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(counter.textContent).toBe('2 / 3');
  });

  it('closes modal on ESC key', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    fireEvent.click(screen.getByTestId('room-photo-badge-0'));
    expect(screen.getByTestId('room-photo-modal')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('room-photo-modal')).toBeNull();
  });

  it('closes modal on backdrop click', () => {
    render(<RoomGrid rooms={[roomThreeImages]} fallbackImage={FALLBACK} />);

    fireEvent.click(screen.getByTestId('room-photo-badge-0'));
    expect(screen.getByTestId('room-photo-modal')).toBeTruthy();

    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(screen.queryByTestId('room-photo-modal')).toBeNull();
  });

  it('renders multiple rooms with correct badge indices', () => {
    render(
      <RoomGrid rooms={[roomOneImage, roomThreeImages, roomZeroImages]} fallbackImage={FALLBACK} />,
    );

    // First room (1 image) - no badge
    expect(screen.queryByTestId('room-photo-badge-0')).toBeNull();
    // Second room (3 images) - badge
    expect(screen.getByTestId('room-photo-badge-1')).toBeTruthy();
    expect(screen.getByTestId('room-photo-badge-1').textContent).toBe('View 3 photos');
    // Third room (0 images) - no badge
    expect(screen.queryByTestId('room-photo-badge-2')).toBeNull();
  });

  it('resets to first image when opening a different room', () => {
    const roomFiveImages: HotelRoom = {
      name: { en: 'Presidential Suite' },
      images: [
        { original: 'https://example.com/p1.jpg' },
        { original: 'https://example.com/p2.jpg' },
        { original: 'https://example.com/p3.jpg' },
        { original: 'https://example.com/p4.jpg' },
        { original: 'https://example.com/p5.jpg' },
      ],
    };

    render(<RoomGrid rooms={[roomThreeImages, roomFiveImages]} fallbackImage={FALLBACK} />);

    // Open first room and navigate to image 2
    fireEvent.click(screen.getByTestId('room-photo-badge-0'));
    fireEvent.click(screen.getByTestId('room-photo-next'));
    expect(screen.getByTestId('room-photo-counter').textContent).toBe('2 / 3');

    // Close and open second room
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('room-photo-badge-1'));

    // Should start at image 1
    expect(screen.getByTestId('room-photo-counter').textContent).toBe('1 / 5');
  });
});
