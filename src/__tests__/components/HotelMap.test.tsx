import { cleanup, render, screen, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
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

function makeHotel(overrides: Partial<Hotel> = {}): Hotel {
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
    ...overrides,
  } as unknown as Hotel;
}

function benefitProgram(benefits: Array<{ en: string; kr: string }>) {
  return { program_name: 'TiP Program', valid_from: null, valid_until: null, benefits };
}

function renderAndSelectHotel(hotel: Hotel = makeHotel()) {
  render(<HotelMap hotels={[hotel]} />);
  // Fire the captured marker click to select the hotel → mounts the InfoWindow.
  act(() => {
    markerClickHandlers.forEach((cb) => cb());
  });
}

// No global RTL auto-cleanup in this repo's vitest setup — clean up explicitly
// so renders don't accumulate across tests.
afterEach(cleanup);

describe('HotelMap perks badge', () => {
  beforeEach(() => {
    markerClickHandlers.length = 0;
    installGoogleMapsStub();
  });

  it('overlays the perks label on the hotel photo (EN)', () => {
    mockLang = 'en';
    renderAndSelectHotel();

    // The key now also titles the popup perks section — pick the overlay badge.
    const badge = screen
      .getAllByText('TiP exclusive perks')
      .find((el) => el.className.includes('absolute'))!;
    expect(badge).toBeDefined();
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

    expect(screen.getAllByText('TiP 독점 혜택 포함').length).toBeGreaterThan(0);
  });
});

describe('HotelMap popup perk details', () => {
  beforeEach(() => {
    markerClickHandlers.length = 0;
    installGoogleMapsStub();
    mockLang = 'en';
  });

  it('shows the hotel benefit strings (localized, ≤3) with no "+N more" line', () => {
    renderAndSelectHotel(
      makeHotel({
        benefits: [
          benefitProgram([
            { en: 'Daily breakfast for two guests', kr: '2인 매일 조식' },
            { en: 'USD 100 hotel credit', kr: '100달러 호텔 크레딧' },
          ]),
        ],
      }),
    );

    expect(screen.getByText('Daily breakfast for two guests')).toBeDefined();
    expect(screen.getByText('USD 100 hotel credit')).toBeDefined();
    expect(screen.queryByText(/more$/)).toBeNull();
    // The generic fallback defaults must NOT render when real benefits exist.
    expect(screen.queryByText(en['hotel.booking_benefit_1'])).toBeNull();
  });

  it('caps at 3 benefits and shows "+N more" for the rest', () => {
    renderAndSelectHotel(
      makeHotel({
        benefits: [
          benefitProgram([
            { en: 'Perk one', kr: '혜택 1' },
            { en: 'Perk two', kr: '혜택 2' },
            { en: 'Perk three', kr: '혜택 3' },
            { en: 'Perk four', kr: '혜택 4' },
            { en: 'Perk five', kr: '혜택 5' },
          ]),
        ],
      }),
    );

    expect(screen.getByText('Perk one')).toBeDefined();
    expect(screen.getByText('Perk two')).toBeDefined();
    expect(screen.getByText('Perk three')).toBeDefined();
    expect(screen.queryByText('Perk four')).toBeNull();
    expect(screen.getByText('+2 more')).toBeDefined();
  });

  it('localizes benefit strings and the "+N more" line in KR', () => {
    mockLang = 'kr';
    renderAndSelectHotel(
      makeHotel({
        benefits: [
          benefitProgram([
            { en: 'Perk one', kr: '혜택 1' },
            { en: 'Perk two', kr: '혜택 2' },
            { en: 'Perk three', kr: '혜택 3' },
            { en: 'Perk four', kr: '혜택 4' },
          ]),
        ],
      }),
    );

    expect(screen.getByText('혜택 1')).toBeDefined();
    expect(screen.queryByText('혜택 4')).toBeNull();
    expect(screen.getByText('+1개 더')).toBeDefined();
  });

  it('falls back to the 4 generic defaults (3 shown + "+1 more") when benefits is empty', () => {
    renderAndSelectHotel(makeHotel({ benefits: [] }));

    expect(screen.getByText(en['hotel.booking_benefit_1'])).toBeDefined();
    expect(screen.getByText(en['hotel.booking_benefit_2'])).toBeDefined();
    expect(screen.getByText(en['hotel.booking_benefit_3'])).toBeDefined();
    expect(screen.queryByText(en['hotel.booking_benefit_4'])).toBeNull();
    expect(screen.getByText('+1 more')).toBeDefined();
  });

  it('keeps the perks section header, the overlay badge, and the detail link together', () => {
    renderAndSelectHotel(
      makeHotel({ benefits: [benefitProgram([{ en: 'Daily breakfast', kr: '매일 조식' }])] }),
    );

    // Both the overlay badge and the section header reuse the same key.
    const labels = screen.getAllByText('TiP exclusive perks');
    expect(labels).toHaveLength(2);
    const overlayBadge = labels.find((el) => el.className.includes('absolute'));
    expect(overlayBadge).toBeDefined();
    // The perks section still sits inside the hotel-detail link.
    expect(screen.getByText('Daily breakfast').closest('a')?.getAttribute('href')).toBe(
      '/hotel/aman-tokyo',
    );
  });
});
