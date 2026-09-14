'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import { reviewRewardRemaining } from '@/lib/points-row';
import { formatPoints } from '@/lib/points-wallet';

interface DeleteReviewConfirmProps {
  /** The trip whose review reward the deletion will claw back. */
  tripId: number;
  onConfirm: () => void;
  onCancel: () => void;
}

type RewardLookup = { status: 'loading' } | { status: 'done'; remaining: number | null };

/**
 * Confirm dialog shown before deleting an APPROVED review (SMA-363): the
 * backend claws back the unconsumed review reward, so the member is told
 * the exact figure. The wallet is fetched lazily when the dialog opens; a
 * missing reward row or a failed fetch degrades to figure-free copy.
 */
export default function DeleteReviewConfirm({
  tripId,
  onConfirm,
  onCancel,
}: DeleteReviewConfirmProps) {
  const { t } = useLanguage();
  const [lookup, setLookup] = useState<RewardLookup>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getMyPoints()
      .then((ledger) => {
        if (cancelled) return;
        setLookup({
          status: 'done',
          remaining: reviewRewardRemaining(ledger.transactions, tripId),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLookup({ status: 'done', remaining: null });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const message =
    lookup.status === 'loading'
      ? t('reviews.delete_confirm_checking')
      : lookup.remaining !== null
        ? t('reviews.delete_confirm_points').replace('{points}', formatPoints(lookup.remaining))
        : t('reviews.delete_confirm_points_no_figure');

  return (
    <Modal isOpen onClose={onCancel} ariaLabel={t('reviews.delete_confirm_title')}>
      <div className="p-6 sm:p-8 max-w-md" data-testid="delete-review-confirm">
        <h2 className="mb-3 pr-10 text-lg font-semibold text-gray-900">
          {t('reviews.delete_confirm_title')}
        </h2>
        <p className="mb-6 text-sm text-gray-600" data-testid="delete-review-confirm-message">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {t('reviews.delete_confirm_keep')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={lookup.status === 'loading'}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="delete-review-confirm-submit"
          >
            {t('reviews.delete_confirm_delete')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
