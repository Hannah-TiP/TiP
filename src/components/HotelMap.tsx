"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import Link from "next/link";
import { Hotel, formatLocation, getImageUrl } from "@/types/hotel";

interface HotelMapProps {
  hotels: Hotel[];
}

const mapContainerStyle = {
  width: "100%",
  height: "520px",
};

const defaultCenter = {
  lat: 20,
  lng: 0,
};

// Libraries array must be static to prevent unnecessary reloads
const libraries: ("marker")[] = ["marker"];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID", // Required for Advanced Markers
  // Note: styles property is not supported when mapId is present
  // Configure map styling in Google Cloud Console instead
};

export default function HotelMap({ hotels }: HotelMapProps) {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    // Fit map bounds to show all hotels
    const bounds = new window.google.maps.LatLngBounds();
    hotels.forEach((hotel) => {
      if (hotel.latitude && hotel.longitude) {
        bounds.extend({ lat: hotel.latitude, lng: hotel.longitude });
      }
    });

    if (hotels.length > 0) {
      map.fitBounds(bounds);
    }

    setMap(map);
  }, [hotels]);

  const onUnmount = useCallback(() => {
    // Clean up markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];
    setMap(null);
  }, []);

  // Create advanced markers when map is loaded
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clean up existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    // Create new markers
    const hotelsWithCoordinates = hotels.filter(
      (hotel) => hotel.latitude && hotel.longitude
    );

    hotelsWithCoordinates.forEach((hotel) => {
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
        position: { lat: hotel.latitude!, lng: hotel.longitude! },
        content: markerElement,
      });

      marker.addListener('gmp-click', () => {
        setSelectedHotel(hotel);
      });

      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup on unmount
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [map, hotels]);

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
      {selectedHotel && selectedHotel.latitude && selectedHotel.longitude && (
        <InfoWindow
          position={{
            lat: selectedHotel.latitude,
            lng: selectedHotel.longitude,
          }}
          onCloseClick={() => setSelectedHotel(null)}
        >
          <div className="max-w-[280px] p-2">
            <Link href={`/hotel/${selectedHotel.id}`} className="group">
              <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg">
                <img
                  src={getImageUrl(selectedHotel.image?.[0])}
                  alt={selectedHotel.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="font-semibold text-green-dark group-hover:text-gold">
                {selectedHotel.name}
              </h3>
              <p className="mt-1 text-[13px] text-gray-text">
                {formatLocation(selectedHotel)}
              </p>
              {selectedHotel.star_rating && (
                <p className="mt-1 text-[11px] font-medium text-gold">
                  {"★".repeat(parseInt(selectedHotel.star_rating))}
                </p>
              )}
              {selectedHotel.review_summary && (
                <p className="mt-1 text-[12px] text-gray-600">
                  {selectedHotel.review_summary.average_rating.toFixed(1)} / 5.0 •{" "}
                  {selectedHotel.review_summary.total_reviews} reviews
                </p>
              )}
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
