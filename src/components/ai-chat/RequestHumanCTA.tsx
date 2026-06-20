'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AIChatSessionStatus } from '@/types/ai-chat';

interface RequestHumanCTAProps {
  sessionStatus: AIChatSessionStatus;
  tripId: number;
  onRequested: () => void;
}

export default function RequestHumanCTA({
  sessionStatus,
  tripId,
  onRequested,
}: RequestHumanCTAProps) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sessionStatus === 'human') {
    return null;
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.requestHumanConcierge(tripId);
      setIsModalOpen(false);
      onRequested();
    } catch {
      setError(t('chat.request_human_error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="border-t border-gray-100 px-4 md:px-[60px] py-3 flex justify-center">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          data-testid="request-human-cta"
          className="font-inter text-xs uppercase tracking-wider text-gray-500 transition-colors hover:text-[#C4956A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4956A] focus-visible:ring-offset-2 rounded px-3 py-1.5"
        >
          {t('chat.request_human_cta')}
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ariaLabel={t('chat.request_human_modal_title')}
      >
        <div className="p-8 max-w-md mx-auto" data-testid="request-human-modal">
          <h2 className="font-primary text-2xl italic text-green-dark mb-4">
            {t('chat.request_human_modal_title')}
          </h2>
          <p className="font-inter text-sm text-gray-600 mb-6 leading-relaxed">
            {t('chat.request_human_modal_body')}
          </p>
          {error && (
            <p className="font-inter text-sm text-red-600 mb-4" data-testid="request-human-error">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="font-inter text-sm px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              data-testid="request-human-cancel"
            >
              {t('chat.request_human_modal_cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="font-inter text-sm px-5 py-2 rounded-full bg-green-dark text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="request-human-confirm"
            >
              {isSubmitting ? '...' : t('chat.request_human_modal_confirm')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
