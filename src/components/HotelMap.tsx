'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import Image from 'next/image';
import Link from 'next/link';
import { getLocalizedText, type GeoPoint } from '@/types/common';
import { Hotel, getHotelCoordinates, getHotelImages } from '@/types/hotel';

interface HotelMapProps {
  hotels: Hotel[];
  /** When set, the map pans and zooms to this city's coordinates. */
  selectedCityGeo?: GeoPoint | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '520px',
};

const defaultCenter = {
  lat: 20,
  lng: 0,
};

/** Zoom level used when focusing on a single city (shows city-level detail). */
const CITY_ZOOM_LEVEL = 12;

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

export default function HotelMap({ hotels, selectedCityGeo }: HotelMapProps) {
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
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #C4956A;
        border: 2px solid #1E3D2F;
        cursor: pointer;
        transition: transform 0.2s;
      `;

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
      } else if (!selectedCityGeo) {
        // Filter change without city selection: animate to fit hotel bounds
        const center = bounds.getCenter();
        map.panTo(center);

        const listener = map.addListener('idle', () => {
          google.maps.event.removeListener(listener);
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
          const zoomListener = map.addListener('idle', () => {
            if (map.getZoom()! > 14) map.setZoom(14);
            google.maps.event.removeListener(zoomListener);
          });
        });
      }
      // When selectedCityGeo is set, the separate useEffect below handles zoom
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
  }, [map, hotels, selectedHotel, selectedCityGeo]);

  // Pan and zoom to selected city when its geo coordinates change
  useEffect(() => {
    if (!map || isInitialFit.current) return;

    if (selectedCityGeo) {
      // Smoothly fly to the selected city
      map.panTo({ lat: selectedCityGeo.lat, lng: selectedCityGeo.lng });
      const listener = map.addListener('idle', () => {
        google.maps.event.removeListener(listener);
        map.setZoom(CITY_ZOOM_LEVEL);
      });
    } else {
      // City filter cleared — return to default view showing all hotels
      const hotelsWithCoordinates = hotels
        .map((hotel) => ({ coordinates: getHotelCoordinates(hotel) }))
        .filter((item) => item.coordinates !== null);

      if (hotelsWithCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        hotelsWithCoordinates.forEach(({ coordinates }) => {
          bounds.extend(coordinates!);
        });
        map.panTo(bounds.getCenter());
        const listener = map.addListener('idle', () => {
          google.maps.event.removeListener(listener);
          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
          const zoomListener = map.addListener('idle', () => {
            if (map.getZoom()! > 14) map.setZoom(14);
            google.maps.event.removeListener(zoomListener);
          });
        });
      }
    }
  }, [map, selectedCityGeo, hotels]);

  if (loadError) {
    return (
      <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
        <div className="text-center">
          <p className="text-[16px] font-medium text-red-600">Error loading map</p>
          <p className="mt-1 text-[13px] text-gray-text">
            Please check your Google Maps API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[520px] items-center justify-center bg-[#E8E4D8]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
          <p className="text-[16px] font-medium text-green-dark">Loading map...</p>
        </div>
      </div>
    );
  }

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
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
