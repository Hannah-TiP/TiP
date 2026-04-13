'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface WishlistContextValue {
  /** Set of hotel IDs currently in the user's wishlist */
  wishlistIds: Set<number>;
  /** Whether the wishlist data is still loading */
  isLoading: boolean;
  /** Toggle a hotel in/out of the wishlist. Returns the new state (true = added). */
  toggleWishlist: (hotelId: number) => Promise<boolean>;
  /** Force-refresh the wishlist from the server */
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const ids = await apiClient.getWishlistIds();
      setWishlistIds(new Set(ids));
    } catch {
      // User may not be logged in — silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleWishlist = useCallback(
    async (hotelId: number): Promise<boolean> => {
      const isCurrentlyWishlisted = wishlistIds.has(hotelId);

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyWishlisted) {
          next.delete(hotelId);
        } else {
          next.add(hotelId);
        }
        return next;
      });

      try {
        if (isCurrentlyWishlisted) {
          await apiClient.removeFromWishlist(hotelId);
          return false;
        } else {
          await apiClient.addToWishlist(hotelId);
          return true;
        }
      } catch {
        // Revert optimistic update on failure
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyWishlisted) {
            next.add(hotelId);
          } else {
            next.delete(hotelId);
          }
          return next;
        });
        throw new Error('Failed to update wishlist');
      }
    },
    [wishlistIds],
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds, isLoading, toggleWishlist, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
