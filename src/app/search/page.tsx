"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import { apiClient } from "@/lib/api-client";
import { formatLocation, getImageUrl, type Hotel } from "@/types/hotel";

// Helper function to derive tag from hotel data
function getHotelTag(hotel: Hotel): string {
  if (hotel.star_rating === "5") return "PALACE";
  if (hotel.star_rating) return `${hotel.star_rating} STAR`;
  return "LUXURY";
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract search parameters
  const cityId = searchParams.get('cityId');
  const cityName = searchParams.get('city');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = searchParams.get('adults');
  const children = searchParams.get('children');
  const tripType = searchParams.get('tripType');
  const travelStyle = searchParams.get('travelStyle');

  // Calculate total guests
  const totalGuests = (parseInt(adults || '2') + parseInt(children || '0'));

  useEffect(() => {
    async function loadHotels() {
      // Redirect to dream-hotels if no city selected
      if (!cityId) {
        window.location.href = '/dream-hotels';
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await apiClient.getHotels({
          city_id: parseInt(cityId),
          language: 'en',
        });

        setHotels(data);
      } catch (err) {
        console.error('Failed to load hotels:', err);
        setError('Failed to load hotels. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadHotels();
  }, [cityId]);

  // Format date range for display
  const dateRange = checkIn && checkOut ? `${checkIn} - ${checkOut}` : null;

  return (
    <main className="min-h-screen bg-gray-light">
      <TopBar activeLink="DREAM HOTELS" />

      {/* Search Section */}
      <section className="bg-white px-[100px] py-8">
        <div className="mx-auto max-w-7xl">
          <SearchBar />

          {/* Search Summary */}
          <div className="mt-6 flex items-center gap-3 text-[14px] text-gray-text">
            {!isLoading && (
              <>
                <span className="font-semibold text-green-dark">
                  {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found
                </span>
                {cityName && (
                  <>
                    <span>•</span>
                    <span>{cityName}</span>
                  </>
                )}
                {dateRange && (
                  <>
                    <span>•</span>
                    <span>{dateRange}</span>
                  </>
                )}
                {totalGuests > 0 && (
                  <>
                    <span>•</span>
                    <span>{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="px-[100px] py-16">
        <div className="mx-auto max-w-7xl">
          {/* Loading State */}
          {isLoading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-dark border-t-transparent"></div>
                <p className="text-[16px] font-medium text-green-dark">
                  Searching hotels in {cityName}...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <span className="icon-lucide mb-4 block text-[48px] text-red-500">&#xe002;</span>
                <p className="mb-4 text-[18px] font-medium text-green-dark">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-green-dark px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && hotels.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <span className="icon-lucide mb-4 block text-[48px] text-gray-400">&#xe8b6;</span>
                <h3 className="mb-2 font-primary text-[28px] italic text-green-dark">
                  No hotels found in {cityName}
                </h3>
                <p className="mb-6 text-[16px] text-gray-text">
                  Try searching a different destination or browse all available hotels.
                </p>
                <Link
                  href="/dream-hotels"
                  className="inline-block rounded-lg bg-green-dark px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Browse All Hotels
                </Link>
              </div>
            </div>
          )}

          {/* Hotel Grid */}
          {!isLoading && !error && hotels.length > 0 && (
            <>
              <div className="mb-8">
                <h2 className="font-primary text-[36px] italic text-green-dark">
                  Hotels in {cityName}
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {hotels.map((hotel) => (
                  <Link
                    key={hotel.id}
                    href={`/hotel/${hotel.id}`}
                    className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={getImageUrl(hotel.image?.[0])}
                        alt={hotel.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                        {getHotelTag(hotel)}
                      </div>
                      {hotel.review_summary && (
                        <div className="absolute right-3 top-3 rounded-full bg-green-dark px-2.5 py-1 text-[12px] font-semibold text-white">
                          {hotel.review_summary.average_rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-primary text-[18px] font-semibold text-green-dark">
                        {hotel.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-gray-text">{formatLocation(hotel)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-light">
        <TopBar activeLink="DREAM HOTELS" />
        <section className="bg-white px-[100px] py-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-gray-text">Loading search results...</p>
          </div>
        </section>
        <Footer />
      </main>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
