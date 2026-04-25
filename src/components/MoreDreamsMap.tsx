'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import Link from 'next/link';
import { getLocalizedText } from '@/types/common';
import type { Activity } from '@/types/activity';
import type { Restaurant } from '@/types/restaurant';
import type { City } from '@/types/location';

interface CityMapData {
  city: City;
  activityCount: number;
  restaurantCount: number;
}

interface MoreDreamsMapProps {
  activities: Activity[];
  restaurants: Restaurant[];
  cities: City[];
  onCitySelect?: (city: City | null) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '520px',
};

const defaultCenter = {
  lat: 20,
  lng: 0,
};

const libraries: 'marker'[] = ['marker'];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
};

export default function MoreDreamsMap({
  activities,
  restaurants,
  cities,
  onCitySelect,
}: MoreDreamsMapProps) {
  const [selectedCity, setSelectedCity] = useState<CityMapData | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const isInitialFit = useRef(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Build city map data: aggregate activity and restaurant counts per city
  const cityMapData: CityMapData[] = (() => {
    const cityMap = new Map<number, CityMapData>();

    cities.forEach((city) => {
      if (city.geo) {
        cityMap.set(city.id, { city, activityCount: 0, restaurantCount: 0 });
      }
    });

    activities.forEach((activity) => {
      if (activity.city_id && cityMap.has(activity.city_id)) {
        cityMap.get(activity.city_id)!.activityCount++;
      }
    });

    restaurants.forEach((restaurant) => {
      if (restaurant.city_id && cityMap.has(restaurant.city_id)) {
        cityMap.get(restaurant.city_id)!.restaurantCount++;
      }
    });

    // Only include cities that have at least one activity or restaurant
    return Array.from(cityMap.values()).filter(
      (data) => data.activityCount > 0 || data.restaurantCount > 0,
    );
  })();

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      const bounds = new window.google.maps.LatLngBounds();
      cityMapData.forEach((data) => {
        if (data.city.geo) {
          bounds.extend(data.city.geo);
        }
      });

      if (cityMapData.length > 0) {
        map.fitBounds(bounds);
      }

      setMap(map);
    },
    [cityMapData],
  );

  const onUnmount = useCallback(() => {
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

    // Create new markers for each city with data
    cityMapData.forEach((data) => {
      if (!data.city.geo) return;

      const total = data.activityCount + data.restaurantCount;

      // Create custom marker element with count badge
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #C4956A;
        border: 2px solid #1E3D2F;
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: #1E3D2F;
      `;
      markerElement.textContent = String(total);

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: data.city.geo,
        content: markerElement,
      });

      marker.addListener('gmp-click', () => {
        setSelectedCity(data);
      });

      markersRef.current.push(marker);
    });

    // Fit map bounds
    if (cityMapData.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      cityMapData.forEach((data) => {
        if (data.city.geo) {
          bounds.extend(data.city.geo);
        }
      });

      if (isInitialFit.current) {
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        const listener = map.addListener('idle', () => {
          if (map.getZoom()! > 14) map.setZoom(14);
          google.maps.event.removeListener(listener);
        });
        isInitialFit.current = false;
      } else {
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
    }

    // Close InfoWindow if selected city is no longer in the data set
    if (selectedCity && !cityMapData.some((d) => d.city.id === selectedCity.city.id)) {
      setSelectedCity(null); // eslint-disable-line react-hooks/set-state-in-effect
    }

    return () => {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [map, cityMapData, selectedCity]);

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
      {selectedCity && selectedCity.city.geo && (
        <InfoWindow position={selectedCity.city.geo} onCloseClick={() => setSelectedCity(null)}>
          <div className="max-w-[280px] p-2">
            <h3 className="font-semibold text-green-dark">
              {getLocalizedText(selectedCity.city.name)}
            </h3>
            <div className="mt-2 space-y-1">
              {selectedCity.activityCount > 0 && (
                <p className="text-[13px] text-gray-text">
                  {selectedCity.activityCount}{' '}
                  {selectedCity.activityCount === 1 ? 'activity' : 'activities'}
                </p>
              )}
              {selectedCity.restaurantCount > 0 && (
                <p className="text-[13px] text-gray-text">
                  {selectedCity.restaurantCount}{' '}
                  {selectedCity.restaurantCount === 1 ? 'restaurant' : 'restaurants'}
                </p>
              )}
            </div>
            {onCitySelect && (
              <button
                onClick={() => onCitySelect(selectedCity.city)}
                className="mt-3 rounded-lg bg-green-dark px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-green-dark/90"
              >
                Explore {getLocalizedText(selectedCity.city.name)}
              </button>
            )}
            <Link
              href={`/more-dreams`}
              className="mt-1 block text-[11px] font-medium text-gold hover:underline"
              onClick={() => onCitySelect?.(selectedCity.city)}
            >
              View all in {getLocalizedText(selectedCity.city.name)}
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
