'use client';

import { useState } from 'react';

interface StarRatingProps {
  /** Current rating (1–5 integer). 0/undefined renders an empty row. */
  value: number;
  /**
   * When provided the stars become interactive buttons that call this on
   * click. Omit for a read-only display.
   */
  onChange?: (rating: number) => void;
  /** Visual size of the stars. */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label prefix for interactive stars. */
  label?: string;
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export default function StarRating({
  value,
  onChange,
  size = 'md',
  label = 'Rating',
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const displayValue = interactive && hover > 0 ? hover : value;
  const sizeClass = SIZE_CLASSES[size];

  if (!interactive) {
    return (
      <div className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            aria-hidden="true"
            className={`${sizeClass} ${star <= value ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            &#9733;
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${label}: ${star} ${star === 1 ? 'star' : 'stars'}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${sizeClass} cursor-pointer p-1 leading-none transition ${
            star <= displayValue ? 'text-yellow-500' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
