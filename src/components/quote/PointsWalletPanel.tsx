'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatRatePercent } from '@/lib/benefits';
import { formatCurrency } from '@/lib/format-currency';
import { formatPoints, parsePoints, pointsInputError } from '@/lib/points-wallet';
import {
  appliedStayCreditAmount,
  type QuoteStatus,
  type QuoteVersion,
  type QuoteWalletSummary,
  type QuoteWithVersion,
} from '@/types/quote';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Points wallet panel on the quote page (SMA-329) — replaced the per-credit
 * stay-credit picker. Shows the wallet balance, the max spendable on THIS
 * booking (per-booking cap), and what's currently applied; lets the customer
 * apply the max, a smaller amount (Q2(b)), or remove the applied points.
 */
export default function PointsWalletPanel({
  quoteId,
  currentVersion,
  status,
  onApplied,
  onError,
}: {
  quoteId: number;
  currentVersion: QuoteVersion;
  status: QuoteStatus;
  onApplied: (bundle: QuoteWithVersion) => void;
  onError: (msg: string) => void;
}) {
  const { t, lang } = useLanguage();
  const [summary, setSummary] = useState<QuoteWalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'apply' | 'remove' | null>(null);
  const [input, setInput] = useState('');

  // Once a quote is PAID / REJECTED / EXPIRED there's nothing to tinker
  // with — the points are either consumed or the offer is gone. We still
  // mount the panel so a paid quote shows the applied line, but skip the
  // wallet fetch and hide the controls.
  const isLocked = status !== 'SENT' && status !== 'DRAFT';

  const appliedPoints = currentVersion.applied_points ?? 0;
  // The amount ACTUALLY deducted comes from the snapshot's points discount
  // line — authoritative and instantly current when a new version lands.
  const appliedAmount = appliedStayCreditAmount(currentVersion.total_snapshot);
  // Legacy pre-SMA-329 versions can carry a stay-credit line with no
  // applied_points; treat any points line as "applied".
  const hasApplied = appliedPoints > 0 || appliedAmount !== null;
  const currency = currentVersion.total_snapshot.currency;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiClient.getQuoteWalletSummary(quoteId, lang);
      setSummary(next);
      setInput(String(next.max_applicable_points));
    } catch (err) {
      onError(err instanceof Error ? err.message : t('quote.error_load_points'));
    } finally {
      setLoading(false);
    }
  }, [quoteId, lang, onError, t]);

  useEffect(() => {
    if (isLocked) return;
    refresh();
  }, [refresh, isLocked]);

  const maxApplicable = summary?.max_applicable_points ?? 0;
  const inputError = summary ? pointsInputError(input, maxApplicable) : null;

  // The per-booking cap in force (SMA-359) comes from the wallet summary's
  // `cap_rate` — the backend config value — never a literal. Before the
  // summary loads (or on an older backend without the field) the hint stays
  // generic.
  const capPercent = summary?.cap_rate ? formatRatePercent(summary.cap_rate) : null;
  const hint = capPercent
    ? t('quote.points_hint_cap').replace('{cap}', capPercent)
    : t('quote.points_hint');

  const handleApply = async () => {
    const points = parsePoints(input);
    if (points === null || inputError) return;
    setBusy('apply');
    try {
      const bundle = await apiClient.applyQuotePoints(quoteId, points, lang);
      onApplied(bundle);
      await refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : t('quote.error_apply_points'));
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    setBusy('remove');
    try {
      const bundle = await apiClient.removeQuotePoints(quoteId, lang);
      onApplied(bundle);
      await refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : t('quote.error_remove_points'));
    } finally {
      setBusy(null);
    }
  };

  if (isLocked && !hasApplied) {
    return null;
  }

  return (
    <div
      data-testid="points-wallet-panel"
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-1">{t('quote.points_title')}</h2>
      <p className="text-xs text-gray-500 mb-4" data-testid="points-hint">
        {hint}
      </p>

      {hasApplied && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 mb-3">
          <p className="text-sm font-semibold text-emerald-800" data-testid="applied-credit">
            {appliedPoints > 0
              ? t('quote.points_applied').replace('{points}', formatPoints(appliedPoints))
              : t('quote.applied')}
            {appliedAmount !== null ? ` · −${formatCurrency(appliedAmount, currency)}` : ''}
          </p>
          {!isLocked && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy !== null}
              data-testid="remove-points-button"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 underline disabled:opacity-50"
            >
              {busy === 'remove' ? t('quote.removing') : t('quote.remove')}
            </button>
          )}
        </div>
      )}

      {!isLocked &&
        (loading && !summary ? (
          <div className="text-sm text-gray-500">{t('quote.points_loading')}</div>
        ) : summary ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('quote.points_balance')}</span>
              <span data-testid="wallet-balance" className="font-semibold text-gray-900">
                {formatPoints(summary.balance_points)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{t('quote.points_max_applicable')}</span>
              <span data-testid="wallet-max" className="font-semibold text-gray-900">
                {formatPoints(summary.max_applicable_points)}
                {Number(summary.max_applicable_amount) > 0
                  ? ` (${formatCurrency(summary.max_applicable_amount, summary.currency)})`
                  : ''}
              </span>
            </div>

            {maxApplicable <= 0 && !hasApplied ? (
              <p className="text-sm text-gray-500" data-testid="no-points">
                {t('quote.points_none')}
              </p>
            ) : maxApplicable > 0 ? (
              <div className="space-y-2">
                <label
                  htmlFor="points-to-apply"
                  className="block text-xs font-semibold text-gray-700"
                >
                  {t('quote.points_input_label')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="points-to-apply"
                    type="text"
                    inputMode="numeric"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    data-testid="points-input"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#1E3D2F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setInput(String(maxApplicable))}
                    data-testid="points-use-max"
                    className="text-xs font-semibold text-[#1E3D2F] hover:text-[#163024] underline whitespace-nowrap"
                  >
                    {t('quote.points_use_max')}
                  </button>
                </div>
                {inputError && (
                  <p className="text-xs text-red-600" data-testid="points-input-error">
                    {inputError === 'invalid'
                      ? t('quote.points_error_invalid')
                      : t('quote.points_error_exceeds').replace(
                          '{points}',
                          formatPoints(maxApplicable),
                        )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={busy !== null || inputError !== null}
                  data-testid="apply-points-button"
                  className="w-full rounded-full bg-[#1E3D2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a5240] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {busy === 'apply' ? t('quote.applying') : t('quote.apply')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null)}
    </div>
  );
}
