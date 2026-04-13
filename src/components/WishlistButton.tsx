'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

interface WishlistButtonProps {
  hotelId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({
  hotelId,
  className = '',
  size = 'md',
}: WishlistButtonProps) {
  const { wishlistIds, toggleWishlist } = useUser();
  const [isAnimating, setIsAnimating] = useState(false);
  const isWishlisted = wishlistIds.has(hotelId);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    try {
      await toggleWishlist(hotelId);
    } catch {
      // Error handled by context
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 24 24"
        fill={isWishlisted ? '#C4956A' : 'none'}
        stroke={isWishlisted ? '#C4956A' : '#666666'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-all duration-200 ${isAnimating ? 'scale-125' : 'scale-100'}`}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
