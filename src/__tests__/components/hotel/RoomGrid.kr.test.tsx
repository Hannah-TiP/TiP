/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import type { ImgHTMLAttributes } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import kr from '@/translations/kr.json';
import RoomGrid from '@/components/hotel/RoomGrid';
import type { HotelRoom } from '@/types/hotel';

const krCatalog = kr as Record<string, string>;

// Force the active UI language to KR (overrides the global en mock).
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
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => <img {...props} alt={props.alt} />,
}));

afterEach(() => cleanup());

const bilingualRoom: HotelRoom = {
  name: { en: 'Deluxe Room', kr: '디럭스 룸' },
  size_sqm: 55,
  summary: { en: 'An elegant room with views.', kr: '전망이 아름다운 우아한 객실.' },
  images: [
    { original: 'https://example.com/deluxe1.jpg' },
    { original: 'https://example.com/deluxe2.jpg' },
  ],
};

describe('RoomGrid (KR)', () => {
  it('renders the Korean room name (card heading + image alt) and summary', () => {
    render(<RoomGrid rooms={[bilingualRoom]} fallbackImage="/fallback.jpg" />);

    expect(screen.getByText('디럭스 룸')).toBeTruthy();
    expect(screen.getByAltText('디럭스 룸')).toBeTruthy();
    expect(screen.getByText('전망이 아름다운 우아한 객실.')).toBeTruthy();
    // English must NOT leak through under the KR toggle.
    expect(screen.queryByText('Deluxe Room')).toBeNull();
    expect(screen.queryByText('An elegant room with views.')).toBeNull();
  });

  it('uses the Korean room name in the lightbox heading and image alt', () => {
    render(<RoomGrid rooms={[bilingualRoom]} fallbackImage="/fallback.jpg" />);

    fireEvent.click(screen.getByTestId('room-photo-badge-0'));

    // Heading (card + modal) resolves to KR.
    expect(screen.getAllByText('디럭스 룸').length).toBeGreaterThanOrEqual(2);
    // Modal image alt is `${krName} 1`.
    expect(screen.getByAltText('디럭스 룸 1')).toBeTruthy();
  });
});
