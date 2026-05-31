'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import { RedeemPromoCodeError, type RedeemPromoCodeErrorCode } from '@/types/stay-credit';

const ERROR_KEY = {
  unknown: 'credits.redeem_error_unknown',
  inactive: 'credits.redeem_error_inactive',
  expired: 'credits.redeem_error_expired',
  max_reached: 'credits.redeem_error_max_reached',
  already_redeemed: 'credits.redeem_error_already_redeemed',
  generic: 'credits.redeem_error_generic',
} as const satisfies Record<RedeemPromoCodeErrorCode, string>;

function formatAmount(amount: string, currency: string, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} ${amount}`;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

interface RedeemCodeSectionProps {
  // Notifies the parent that a redemption succeeded so it can refresh the
  // wallet balance + history.
  onRedeemed: () => void;
}

export default function RedeemCodeSection({ onRedeemed }: RedeemCodeSectionProps) {
  const { lang, t } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'ko-KR';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const result = await apiClient.redeemPromoCode(trimmed);
      const amount = formatAmount(result.credited_amount, result.currency, locale);
      setSuccess(t('credits.redeem_success').replace('{amount}', amount));
      setCode('');
      onRedeemed();
    } catch (err) {
      const errorCode: RedeemPromoCodeErrorCode =
        err instanceof RedeemPromoCodeError ? err.code : 'generic';
      setError(t(ERROR_KEY[errorCode]));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 mb-10"
      data-testid="redeem-code-section"
    >
      <h2 className="font-primary text-[26px] italic text-[#1E3D2F]">
        {t('credits.redeem_title')}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
        {t('credits.redeem_subtitle')}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setSuccess(null);
            setError(null);
          }}
          placeholder={t('credits.redeem_placeholder')}
          aria-label={t('credits.redeem_placeholder')}
          data-testid="redeem-code-input"
          className="w-full flex-1 rounded-full border border-gray-300 px-5 py-3 text-[15px] outline-none focus:border-[#1E3D2F]"
        />
        <button
          type="submit"
          disabled={submitting || code.trim().length === 0}
          data-testid="redeem-code-submit"
          className="rounded-full bg-[#1E3D2F] px-7 py-3 text-[14px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t('credits.redeem_submitting') : t('credits.redeem_button')}
        </button>
      </form>

      {success && (
        <div
          className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700"
          data-testid="redeem-code-success"
        >
          {success}
        </div>
      )}
      {error && (
        <div
          className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-[14px] text-rose-700"
          data-testid="redeem-code-error"
        >
          {error}
        </div>
      )}
    </div>
  );
}
