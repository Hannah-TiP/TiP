import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect, useRef } from 'react';
import type { AnchorHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import HotelMap from '@/components/HotelMap';
import type { Hotel } from '@/types/hotel';
import en from '@/translations/en.json';
import kr from '@/translations/kr.json';

// Capture the gmp-click listener registered on the (stubbed) advanced marker so
// the test can select a hotel and force the InfoWindow popup to mount.
const markerClickHandlers: Array<() => void> = [];

// GoogleMap is rendered as a pass-through that immediately invokes onLoad with a
// stub map so the marker-creation effect runs under jsdom.
vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => ({ isLoaded: true, loadError: undefined }),
  GoogleMap: ({ children, onLoad }: { children?: ReactNode; onLoad?: (map: unknown) => void }) => {
    const called = useRef(false);
    useEffect(() => {
      // Mirror the real component: onLoad fires exactly once after mount with a
      // stable map instance (firing on every render would loop setMap forever).
      if (onLoad && !called.current) {
        called.current = true;
        onLoad({
          fitBounds: vi.fn(),
          panTo: vi.fn(),
          setZoom: vi.fn(),
          getZoom: () => 5,
          addListener: vi.fn(),
        });
      }
    }, [onLoad]);
    return <div>{children}</div>;
  },
  InfoWindow: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    sizes: _sizes,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt} />
  ),
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

let mockLang: 'en' | 'kr' = 'en';
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: mockLang,
    setLang: vi.fn(),
    t: (key: string) => ((mockLang === 'kr' ? kr : en) as Record<string, string>)[key] ?? key,
  }),
}));

function installGoogleMapsStub() {
  const stub = {
    maps: {
      LatLngBounds: class {
        extend() {}
        getCenter() {
          return {};
        }
      },
      event: { removeListener: vi.fn() },
      marker: {
        AdvancedMarkerElement: class {
          map: unknown = null;
          addListener(event: string, cb: () => void) {
            if (event === 'gmp-click') markerClickHandlers.push(cb);
          }
        },
      },
    },
  };
  (globalThis.window as unknown as { google: unknown }).google = stub;
}

function makeHotel(): Hotel {
  return {
    id: 1,
    slug: 'aman-tokyo',
    status: 'published',
    star_rating: '5',
    name: { en: 'Aman Tokyo', kr: '아만 도쿄' },
    address: { en: '1-5-6 Otemachi', kr: '오테마치' },
    geo: { lat: 35.6, lng: 139.7 },
    images: [{ id: 1, url: 'https://example.com/a.jpg' }],
    schema_version: 1,
  } as unknown as Hotel;
}

function renderAndSelectHotel() {
  render(<HotelMap hotels={[makeHotel()]} />);
  // Fire the captured marker click to select the hotel → mounts the InfoWindow.
  act(() => {
    markerClickHandlers.forEach((cb) => cb());
  });
}

describe('HotelMap perks badge', () => {
  beforeEach(() => {
    markerClickHandlers.length = 0;
    installGoogleMapsStub();
  });

  it('overlays the perks label on the hotel photo (EN)', () => {
    mockLang = 'en';
    renderAndSelectHotel();

    const badge = screen.getByText('TiP exclusive perks');
    // Overlay positioning + brand scrim/gold styling.
    expect(badge.className).toContain('absolute');
    expect(badge.className).toContain('left-2');
    expect(badge.className).toContain('top-2');
    expect(badge.className).toContain('z-10');
    expect(badge.className).toContain('bg-green-dark/85');
    expect(badge.className).toContain('text-gold');

    // Badge sits inside the image container (sibling of the photo), within the
    // hotel-detail link so a click still routes to the hotel page.
    const imageContainer = badge.parentElement!;
    expect(imageContainer.className).toContain('overflow-hidden');
    expect(imageContainer.querySelector('img')).not.toBeNull();
    expect(badge.closest('a')?.getAttribute('href')).toBe('/hotel/aman-tokyo');
  });

  it('renders the Korean perks label when language is KR', () => {
    mockLang = 'kr';
    renderAndSelectHotel();

    expect(screen.getByText('TiP 독점 혜택 포함')).toBeDefined();
  });
});
