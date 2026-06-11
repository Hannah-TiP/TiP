'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import PasswordInput from '@/components/PasswordInput';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(t('register.error_password_too_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('register.error_passwords_mismatch'));
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.changePassword(currentPassword, newPassword);
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('change_password.error_generic'));
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3D2F]/30 focus:border-[#1E3D2F]';

  return (
    <Modal isOpen={open} onClose={handleClose} ariaLabel={t('change_password.title')}>
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 max-w-md"
        data-testid="change-password-form"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t('change_password.title')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('change_password.subtitle')}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('change_password.current_password')}
            </label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('change_password.current_password_placeholder')}
              autoComplete="current-password"
              disabled={submitting}
              className={inputClass}
              data-testid="current-password-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('change_password.new_password')}
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('change_password.new_password_placeholder')}
              autoComplete="new-password"
              disabled={submitting}
              className={inputClass}
              data-testid="new-password-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('change_password.confirm_password')}
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('change_password.confirm_password_placeholder')}
              autoComplete="new-password"
              disabled={submitting}
              className={inputClass}
              data-testid="confirm-password-input"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-4" data-testid="change-password-error">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('change_password.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E3D2F] rounded-lg hover:bg-[#163024] transition disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="change-password-submit"
          >
            {submitting ? t('change_password.submitting') : t('change_password.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
