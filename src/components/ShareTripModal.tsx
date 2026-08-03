'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  /**
   * When the caller is the trip owner, the cost / booking-document toggles are
   * shown. Resharers (non-owners) inherit their own permissions on the server,
   * so the toggles are hidden for them to avoid implying they can escalate.
   */
  canControlVisibility?: boolean;
}

const MAX_EMAILS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Split a free-text field into individual email tokens (comma / whitespace). */
export function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export default function ShareTripModal({
  isOpen,
  onClose,
  tripId,
  canControlVisibility = true,
}: ShareTripModalProps) {
  const { t, lang } = useLanguage();
  const [emailsInput, setEmailsInput] = useState('');
  const [showCost, setShowCost] = useState(true);
  const [showBookingDocuments, setShowBookingDocuments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const reset = () => {
    setEmailsInput('');
    setShowCost(true);
    setShowBookingDocuments(true);
    setError(null);
    setSuccessCount(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessCount(null);

    const emails = parseEmails(emailsInput);
    if (emails.length === 0) {
      setError(t('share_trip.error_no_email'));
      return;
    }
    if (emails.length > MAX_EMAILS) {
      setError(t('share_trip.error_too_many'));
      return;
    }
    const invalid = emails.filter((e) => !EMAIL_RE.test(e));
    if (invalid.length > 0) {
      setError(t('share_trip.error_invalid').replace('{emails}', invalid.join(', ')));
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiClient.shareTrip(
        tripId,
        {
          emails,
          show_cost: canControlVisibility ? showCost : true,
          show_booking_documents: canControlVisibility ? showBookingDocuments : true,
        },
        lang,
      );
      setSuccessCount(result.shared_count);
      setEmailsInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('share_trip.error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} ariaLabel={t('share_trip.title')}>
      <div className="p-6 md:p-8 max-w-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('share_trip.title')}</h2>
        <p className="text-sm text-gray-500 mb-5">{t('share_trip.subtitle')}</p>

        <label htmlFor="share-emails" className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('share_trip.emails_label')}
        </label>
        <textarea
          id="share-emails"
          value={emailsInput}
          onChange={(e) => setEmailsInput(e.target.value)}
          rows={3}
          placeholder={t('share_trip.emails_placeholder')}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#1E3D2F] focus:outline-none"
          data-testid="share-emails-input"
        />
        <p className="text-xs text-gray-400 mt-1">{t('share_trip.emails_hint')}</p>

        {canControlVisibility && (
          <div className="mt-5 space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{t('share_trip.show_cost')}</span>
              <input
                type="checkbox"
                checked={showCost}
                onChange={(e) => setShowCost(e.target.checked)}
                className="h-4 w-4 accent-[#1E3D2F]"
                data-testid="share-show-cost"
                aria-label={t('share_trip.show_cost')}
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{t('share_trip.show_documents')}</span>
              <input
                type="checkbox"
                checked={showBookingDocuments}
                onChange={(e) => setShowBookingDocuments(e.target.checked)}
                className="h-4 w-4 accent-[#1E3D2F]"
                data-testid="share-show-documents"
                aria-label={t('share_trip.show_documents')}
              />
            </label>
          </div>
        )}

        {error && (
          <div
            className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
            data-testid="share-error"
          >
            {error}
          </div>
        )}

        {successCount !== null && (
          <div
            className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700"
            data-testid="share-success"
          >
            {successCount > 0
              ? t('share_trip.success').replace('{count}', String(successCount))
              : t('share_trip.success_updated')}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
          >
            {t('share_trip.close')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-[#1E3D2F] text-white text-sm font-medium rounded-full hover:bg-[#2a5240] transition-colors disabled:opacity-50"
            data-testid="share-submit"
          >
            {submitting ? t('share_trip.sending') : t('share_trip.send')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
