'use client';

import { useEffect, useState } from 'react';
import { fetchBenefits } from '@/lib/benefits';
import type { BenefitsResponse } from '@/types/v2/benefits';

// The benefit registry payload, or null while loading / when the endpoint
// is unavailable (consumers degrade to static fallbacks — never crash).
// Backed by the module-level cache in src/lib/benefits.ts, so mounting this
// hook on several pages costs one request per session.
export function useBenefits(): BenefitsResponse | null {
  const [benefits, setBenefits] = useState<BenefitsResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetchBenefits().then((response) => {
      if (active && response) setBenefits(response);
    });
    return () => {
      active = false;
    };
  }, []);

  return benefits;
}
