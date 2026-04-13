'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import SubNav from '@/components/SubNav';
import Footer from '@/components/Footer';
import WishlistButton from '@/components/WishlistButton';
import { apiClient } from '@/lib/api-client';
import { getLocalizedText } from '@/types/common';
import { getHotelImages } from '@/types/hotel';
import type { WishlistItem } from '@/types/wishlist';

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="text-center py-24">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
        <h2 className="mt-6 font-primary text-[32px] italic text-green-dark">
          Your wishlist is empty
        </h2>
        <p className="mt-3 text-[15px] text-gray-text">
          Save hotels you love by tapping the heart icon on any hotel.
        </p>
        <Link
          href="/dream-hotels"
          className="mt-8 inline-block rounded-full bg-green-dark px-8 py-3 text-[13px] font-semibold tracking-wider text-white transition-colors hover:bg-green-dark/90"
        >
          EXPLORE HOTELS
        </Link>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const data = await apiClient.getWishlist();
        setItems(data);
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadWishlist();
  }, []);

  return (
    <main className="min-h-screen bg-gray-light">
      <TopBar activeLink="My Page" />
      <SubNav activeTab="Wishlist" />

      <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
        <h1 className="font-primary text-[42px] italic text-green-dark">My Wishlist</h1>
        <p className="mt-2 text-[15px] text-gray-text">Hotels you have saved for future travels.</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <p className="mb-6 text-[13px] text-gray-text">
            {items.length} {items.length === 1 ? 'hotel' : 'hotels'} saved
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.wishlist_id}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <Link href={`/hotel/${item.hotel.slug}`}>
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={getHotelImages(item.hotel)[0]}
                      alt={getLocalizedText(item.hotel.name)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute right-3 top-3 z-10">
                      <WishlistButton hotelId={item.hotel.id} size="sm" />
                    </div>
                    {item.hotel.star_rating && (
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-wider text-green-dark backdrop-blur-sm">
                        {item.hotel.star_rating} STAR
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-5">
                  <Link href={`/hotel/${item.hotel.slug}`}>
                    <h3 className="font-primary text-[18px] font-semibold text-green-dark hover:text-gold transition-colors">
                      {getLocalizedText(item.hotel.name)}
                    </h3>
                  </Link>
                  <p className="mt-1 text-[13px] text-gray-text">
                    {getLocalizedText(item.hotel.address)}
                  </p>
                  {item.added_at && (
                    <p className="mt-3 text-[11px] text-gray-text/60">
                      Saved{' '}
                      {new Date(item.added_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
