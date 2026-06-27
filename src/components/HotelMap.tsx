'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import { getLocalizedText } from '@/types/common';
import { Hotel, getHotelCoordinates, getHotelImages } from '@/types/hotel';
import { formatRatingBadge, formatReviewSummary, type ReviewAggregate } from '@/types/review';
import { localizeBenefitStrings } from '@/lib/hotel-benefits';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_POPUP_PERKS = 3;

interface HotelMapProps {
  hotels: Hotel[];
  reviewAggregates?: Record<number, ReviewAggregate>;
}

const mapContainerStyle = {
  width: '100%',
  height: '520px',
};

const defaultCenter = {
  lat: 20,
  lng: 0,
};

// Libraries array must be static to prevent unnecessary reloads
const libraries: 'marker'[] = ['marker'];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID', // Required for Advanced Markers
  // Note: styles property is not supported when mapId is present
  // Configure map styling in Google Cloud Console instead
};

export default function HotelMap({ hotels, reviewAggregates }: HotelMapProps) {
  const { t, lang } = useLanguage();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const isInitialFit = useRef(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      // Fit map bounds to show all hotels
      const bounds = new window.google.maps.LatLngBounds();
      hotels.forEach((hotel) => {
        const coordinates = getHotelCoordinates(hotel);
        if (coordinates) {
          bounds.extend(coordinates);
        }
      });

      if (hotels.length > 0) {
        map.fitBounds(bounds);
      }

      setMap(map);
    },
    [hotels],
  );

  const onUnmount = useCallback(() => {
    // Clean up markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];
    setMap(null);
  }, []);

  // Create advanced markers when map is loaded
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clean up existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    // Create new markers
    const hotelsWithCoordinates = hotels
      .map((hotel) => ({ hotel, coordinates: getHotelCoordinates(hotel) }))
      .filter((item) => item.coordinates !== null);

    hotelsWithCoordinates.forEach(({ hotel, coordinates }) => {
      // Wrapper holds the gold dot plus an optional review badge.
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        position: relative;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: transform 0.2s;
      `;

      const dotElement = document.createElement('div');
      dotElement.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #C4956A;
        border: 2px solid #1E3D2F;
        flex-shrink: 0;
      `;
      markerElement.appendChild(dotElement);

      const badgeLabel = formatRatingBadge(reviewAggregates?.[hotel.id]);
      if (badgeLabel !== null) {
        const badgeElement = document.createElement('span');
        badgeElement.style.cssText = `
          margin-left: 4px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 1px 6px;
          border-radius: 9999px;
          background-color: #C4956A;
          color: #1E3D2F;
          border: 1px solid #1E3D2F;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
          white-space: nowrap;
        `;
        badgeElement.textContent = `${badgeLabel} ★`;
        markerElement.appendChild(badgeElement);
      }

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: coordinates!,
        content: markerElement,
      });

      marker.addListener('gmp-click', () => {
        setSelectedHotel(hotel);
      });

      markersRef.current.push(marker);
    });

    // Fit map bounds to show filtered hotels
    if (hotelsWithCoordinates.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      hotelsWithCoordinates.forEach(({ coordinates }) => {
        bounds.extend(coordinates!);
      });

      if (isInitialFit.current) {
        // First load: snap instantly
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        const listener = map.addListener('idle', () => {
          if (map.getZoom()! > 14) map.setZoom(14);
          google.maps.event.removeListener(listener);
        });
        isInitialFit.current = false;
      } else {
        // Filter change: animate smoothly
        // panTo animates to center, then we zoom after the pan settles
        const center = bounds.getCenter();
        map.panTo(center);

        const listener = map.addListener('idle', () => {
          google.maps.event.removeListener(listener);
          // Now fit bounds after pan, capping zoom for single hotels
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
          const zoomListener = map.addListener('idle', () => {
            if (map.getZoom()! > 14) map.setZoom(14);
            google.maps.event.removeListener(zoomListener);
          });
        });
      }
    }

    // Close InfoWindow if selected hotel is no longer in the filtered set
    if (selectedHotel && !hotels.some((h) => h.id === selectedHotel.id)) {
      setSelectedHotel(null); // eslint-disable-line react-hooks/set-state-in-effect
    }

    return () => {
      // Cleanup on unmount
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [map, hotels, selectedHotel, reviewAggregates]);

  if (loadError) {
    return (
      <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
        <div className="text-center">
          <p className="text-[16px] font-medium text-red-600">{t('map.error_title')}</p>
          <p className="mt-1 text-[13px] text-gray-text">{t('map.error_subtitle')}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          <p className="text-[16px] font-medium text-green-dark">{t('map.loading')}</p>
        </div>
      </div>
    );
  }

  // Compact perk teaser for the popup: localized benefit strings (no date
  // filtering / eligibility labels — no stay-date context on the map). When a
  // hotel has no real benefits the section is hidden entirely.
  const hotelPerks = selectedHotel ? localizeBenefitStrings(selectedHotel.benefits, lang) : [];
  const visiblePerks = hotelPerks.slice(0, MAX_POPUP_PERKS);
  const morePerksCount = hotelPerks.length - visiblePerks.length;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={2}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {selectedHotel && getHotelCoordinates(selectedHotel) && (
        <InfoWindow
          position={getHotelCoordinates(selectedHotel)!}
          onCloseClick={() => setSelectedHotel(null)}
        >
          <div className="max-w-[280px] p-2">
            <Link href={`/hotel/${selectedHotel.slug}`} className="group">
              <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg">
                <Image
                  src={getHotelImages(selectedHotel)[0]}
                  alt={getLocalizedText(selectedHotel.name)}
                  fill
                  sizes="280px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {hotelPerks.length > 0 && (
                  <span className="absolute left-2 top-2 z-10 rounded bg-green-dark/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-gold">
                    {t('hotel.tip_exclusive_perks')}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-green-dark group-hover:text-gold">
                {getLocalizedText(selectedHotel.name)}
              </h3>
              <p className="mt-1 text-[13px] text-gray-text">
                {getLocalizedText(selectedHotel.address)}
              </p>
              {selectedHotel.star_rating && (
                <p className="mt-1 text-[11px] font-medium text-gold">
                  {'★'.repeat(parseInt(selectedHotel.star_rating))}
                </p>
              )}
              {formatReviewSummary(reviewAggregates?.[selectedHotel.id]) && (
                <p className="mt-1 text-[12px] font-medium text-green-dark">
                  {formatReviewSummary(reviewAggregates?.[selectedHotel.id])}
                </p>
              )}
              {hotelPerks.length > 0 && (
                <div className="mt-2 border-t border-gray-border pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-gold">
                    {t('hotel.tip_exclusive_perks')}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {visiblePerks.map((perk, index) => (
                      <li
                        key={`${index}-${perk}`}
                        className="flex items-start gap-1.5 text-xs text-green-dark"
                      >
                        <span aria-hidden="true" className="flex-shrink-0 text-gold">
                          ✓
                        </span>
                        <span className="truncate">{perk}</span>
                      </li>
                    ))}
                  </ul>
                  {morePerksCount > 0 && (
                    <p className="mt-1 text-[11px] text-gray-text">
                      {t('hotel.perks_more_count').replace('{count}', String(morePerksCount))}
                    </p>
                  )}
                </div>
              )}
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
