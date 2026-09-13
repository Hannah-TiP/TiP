'use client';

import { useEffect, useState } from 'react';

// Mirrors the backend Pydantic model VerificationDeliveryStatus
// (GET /api/v2/auth/verification-delivery-status).
export interface VerificationDeliveryStatus {
  status: 'pending' | 'failed';
  reason_category: string | null;
}

export interface VerificationDeliveryState {
  failed: boolean;
  reasonCategory: string | null;
}

interface FailureRecord {
  email: string;
  reasonCategory: string | null;
}

export const POLL_INTERVAL_MS = 5000;
// ~3 minutes of polling at 5s per attempt, then give up silently.
export const MAX_POLLS = 36;

/**
 * Polls the verification-email delivery status while the user sits on a
 * code-entry step. Every 5s (for up to ~3 min) it asks the backend whether
 * the Brevo event webhook flagged the address as bounced/blocked.
 *
 * Stops polling on: terminal state (failed), unmount, `active` turning
 * false, or the poll budget running out. While the tab is hidden the fetch
 * is skipped (the attempt still counts toward the budget).
 */
export function useVerificationDeliveryStatus(
  email: string,
  active: boolean,
): VerificationDeliveryState {
  // The last observed failure, keyed by email — the returned state derives
  // from it so a different email (or an inactive step) reads as not-failed.
  const [failure, setFailure] = useState<FailureRecord | null>(null);

  useEffect(() => {
    if (!active || !email) return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled || attempts >= MAX_POLLS) return;
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      // Don't hit the API while the tab is hidden — keep waiting instead.
      if (typeof document !== 'undefined' && document.hidden) {
        schedule();
        return;
      }
      try {
        const res = await fetch(
          `/api/auth/verification-delivery-status?email=${encodeURIComponent(email)}`,
        );
        if (res.ok) {
          const data: VerificationDeliveryStatus = await res.json();
          if (cancelled) return;
          if (data.status === 'failed') {
            setFailure({ email, reasonCategory: data.reason_category ?? null });
            return; // terminal — stop polling
          }
        }
      } catch {
        // Network hiccup — keep polling until the budget runs out.
      }
      schedule();
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [email, active]);

  const isCurrentFailure = active && failure !== null && failure.email === email;
  return {
    failed: isCurrentFailure,
    reasonCategory: isCurrentFailure ? failure.reasonCategory : null,
  };
}
