// Types matching backend API response structure
// Backend City schema only includes id and name (no country object)
// We'll extract country from the address field on the frontend

export interface City {
  id: number;
  name: string;
}

export interface ReviewSummary {
  id: number;
  total_reviews: number;
  average_rating: number; // 0-5 scale
  rating_distribution: {
    [key: string]: number;
  };
}

export interface Activity {
  id: number;
  name: string;
  description?: string;
  image?: string;
  review_summary?: ReviewSummary;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  image?: string;
}

export interface Hotel {
  id: number;
  name: string;
  city_id: number;
  city?: City;
  star_rating?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  image?: string[]; // Array of image URLs
  available_rooms?: string[];
  content?: string;
  language: string;
  review_summary?: ReviewSummary;
  transfers_available?: boolean;
  transfer_vehicle_types?: string;
  transfer_capacity?: number;
  transfer_description?: string;
  transfer_photos?: string[];
  spa_available?: boolean;
  spa_included_facilities?: string[];
  spa_treatment_name?: string;
  spa_treatment_type?: string;
  spa_duration?: number;
  spa_description?: string;
  spa_photos?: string[];
  special_experience_available?: boolean;
  special_experience_title?: string;
  special_experience_type?: string;
  special_experience_duration?: number;
  special_experience_description?: string;
  special_experience_photos?: string[];
  activities?: Activity[];
  restaurants?: Restaurant[];
}

// Helper function to extract country from address
// Example: "112 Rue du Faubourg Saint-Honoré, 75008 Paris, France" -> "France"
export function extractCountryFromAddress(address?: string): string {
  if (!address) return '';
  const parts = address.split(',');
  return parts[parts.length - 1].trim();
}

// Helper function to format location as "City, Country"
export function formatLocation(hotel: Hotel): string {
  const city = hotel.city?.name || '';
  const country = extractCountryFromAddress(hotel.address);
  return country ? `${city}, ${country}` : city;
}

// Helper function to convert S3 path to full URL
// Example: "tip/hotel/image.jpg" -> "https://tip-s3-bucket.s3.us-west-1.amazonaws.com/tip/hotel/image.jpg"
export function getImageUrl(imagePath?: string): string {
  if (!imagePath) return '/placeholder.jpg';

  // If it's already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Convert S3 path to full URL using environment variable
  const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
  if (!s3Endpoint) {
    console.warn('NEXT_PUBLIC_S3_ENDPOINT not configured');
    return '/placeholder.jpg';
  }

  // Ensure no double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${s3Endpoint}/${cleanPath}`;
}

// Helper function to convert all hotel images
export function getHotelImages(hotel: Hotel): string[] {
  if (!hotel.image || hotel.image.length === 0) {
    return ['/placeholder.jpg'];
  }
  return hotel.image.map(img => getImageUrl(img));
}
