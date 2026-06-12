'use client';

import Modal from '@/components/Modal';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryFailedDialogProps {
  isOpen: boolean;
  email: string;
  onUseDifferentEmail: () => void;
  onClose: () => void;
}

/**
 * Shown on the signup / forgot-password code-entry steps when the Brevo
 * event webhook reports that the verification email to the user's address
 * bounced (e.g. a Korean ISP blocking the sending IP).
 */
export default function DeliveryFailedDialog({
  isOpen,
  email,
  onUseDifferentEmail,
  onClose,
}: DeliveryFailedDialogProps) {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={t('delivery_failed.title')}>
      <div className="flex max-w-md flex-col gap-4 p-6 sm:p-8" data-testid="delivery-failed-dialog">
        <h2 className="text-[20px] font-semibold text-green-dark">{t('delivery_failed.title')}</h2>

        <p className="text-sm text-gray-text">
          {t('delivery_failed.body').replace('{email}', email)}
        </p>

        <p className="rounded-lg bg-gold/10 p-3 text-sm text-green-dark">
          {t('delivery_failed.kr_isp_note')}
        </p>

        <button
          type="button"
          onClick={onUseDifferentEmail}
          data-testid="delivery-failed-use-different-email"
          className="h-12 w-full rounded-lg bg-green-dark text-white"
        >
          {t('delivery_failed.use_different_email')}
        </button>
      </div>
    </Modal>
  );
}
