'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Modal from '@/components/Modal';
import PasswordInput from '@/components/PasswordInput';
import { apiClient } from '@/lib/api-client';
import { clearLocalAccountState } from '@/lib/account';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  // From the v2 me response — password accounts re-auth with their password,
  // social-only accounts with a fresh `account_deletion` email OTP.
  hasPassword: boolean;
}

export default function DeleteAccountModal({
  open,
  onClose,
  email,
  hasPassword,
}: DeleteAccountModalProps) {
  const { t, lang } = useLanguage();

  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function reset() {
    setPassword('');
    setCode('');
    setCodeSent(false);
    setSendingCode(false);
    setConfirmChecked(false);
    setSubmitting(false);
    setError('');
    setSuccess(false);
  }

  // The account is already deactivated server-side once we reach the success
  // state, so every way out of the modal (OK, X, backdrop, Escape) clears
  // local state and signs the user out.
  function finalizeSignOut() {
    clearLocalAccountState();
    signOut({ callbackUrl: '/' });
  }

  function handleClose() {
    if (submitting) return;
    if (success) {
      finalizeSignOut();
      return;
    }
    reset();
    onClose();
  }

  async function handleSendCode() {
    setError('');
    try {
      setSendingCode(true);
      await apiClient.sendVerificationCode(email, 'account_deletion', lang);
      setCodeSent(true);
    } catch {
      setError(t('delete_account.error_send_code'));
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      await apiClient.deleteAccount(hasPassword ? { password } : { verification_code: code }, lang);
      setSuccess(true);
    } catch (err) {
      if (err instanceof TypeError) {
        // fetch itself failed — no response from the proxy at all.
        setError(t('delete_account.error_network'));
      } else if (err instanceof Error && err.message && err.message !== 'Request failed') {
        // Backend re-auth / deletion errors arrive localized (the proxy
        // forwards the UI language): wrong password, invalid or expired
        // code, deletion already processed, etc.
        setError(err.message);
      } else {
        setError(t('delete_account.error_generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600';

  const reauthMissing = hasPassword ? !password : !code;

  return (
    <Modal isOpen={open} onClose={handleClose} ariaLabel={t('account.delete.disclosure_title')}>
      {success ? (
        <div className="p-6 sm:p-8 max-w-md" data-testid="delete-account-success">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {t('delete_account.success_title')}
          </h2>
          <p className="text-sm text-gray-600 mb-6">{t('delete_account.success_message')}</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={finalizeSignOut}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#1E3D2F] rounded-lg hover:bg-[#163024] transition"
              data-testid="delete-success-ok"
            >
              {t('delete_account.success_ok')}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 max-w-lg"
          data-testid="delete-account-form"
        >
          <h2 className="text-xl font-bold text-red-700 mb-1">
            {t('account.delete.disclosure_title')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">{t('account.delete.disclosure_intro')}</p>

          {/* Deleted vs retained disclosure (SMA-192 copy) */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-5 space-y-2">
            <p className="text-sm text-red-800">{t('account.delete.disclosure_deleted')}</p>
            <p className="text-sm text-red-800">{t('account.delete.disclosure_retained_intro')}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm text-red-800">
                {t('account.delete.disclosure_retained_financial')}
              </li>
              <li className="text-sm text-red-800">
                {t('account.delete.disclosure_retained_disputes')}
              </li>
            </ul>
            <p className="text-sm text-red-800">{t('account.delete.disclosure_grace')}</p>
            <p className="text-sm font-semibold text-red-800">
              {t('account.delete.disclosure_irreversible')}
            </p>
          </div>

          {/* Re-authentication */}
          <p className="text-sm text-gray-600 mb-3">{t('delete_account.reauth_intro')}</p>
          {hasPassword ? (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('delete_account.password_label')}
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('delete_account.password_placeholder')}
                autoComplete="current-password"
                disabled={submitting}
                className={inputClass}
                data-testid="delete-password-input"
              />
            </div>
          ) : (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('delete_account.code_label')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('delete_account.code_placeholder')}
                  autoComplete="one-time-code"
                  disabled={submitting}
                  className={inputClass}
                  data-testid="delete-code-input"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || submitting}
                  className="shrink-0 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="send-code-button"
                >
                  {sendingCode
                    ? t('delete_account.sending_code')
                    : codeSent
                      ? t('delete_account.resend_code')
                      : t('delete_account.send_code')}
                </button>
              </div>
              {codeSent && (
                <p className="text-sm text-green-700 mt-1.5" data-testid="delete-code-sent">
                  {t('delete_account.code_sent')}
                </p>
              )}
            </div>
          )}

          {/* Explicit confirm step */}
          <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 accent-red-600"
              data-testid="delete-confirm-checkbox"
            />
            <span className="text-sm text-gray-700">{t('delete_account.confirm_checkbox')}</span>
          </label>

          {error && (
            <p className="text-sm text-red-600 mb-4" data-testid="delete-account-error">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('delete_account.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !confirmChecked || reauthMissing}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="delete-account-submit"
            >
              {submitting ? t('delete_account.submitting') : t('delete_account.submit')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
