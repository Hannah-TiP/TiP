'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKeys } from '@/contexts/LanguageContext';
import type { MemberFreeNightSummary, MembershipFreeNight } from '@/types/free-night';

function tierDescriptionKey(tier: MemberFreeNightSummary['tier']): TranslationKeys | null {
  if (tier === 'cercle') return 'membership.free_night_cercle_desc';
  if (tier === 'confidence') return 'membership.free_night_confidence_desc';
  if (tier === 'cenacle') return 'membership.free_night_cenacle_desc';
  return null;
}

function statusKey(status: MembershipFreeNight['status']): TranslationKeys {
  if (status === 'redeemed') return 'membership.free_night_status_redeemed';
  if (status === 'expired') return 'membership.free_night_status_expired';
  return 'membership.free_night_status_awarded';
}

function formatDate(iso: string | null, en: boolean): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(en ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function FreeNightSummary() {
  const { t, lang } = useLanguage();
  const en = lang === 'en';
  const [summary, setSummary] = useState<MemberFreeNightSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .getMyFreeNights()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setSummary(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !summary || !summary.accrues) return null;

  const descKey = tierDescriptionKey(summary.tier);
  const hasProgress =
    summary.threshold !== null &&
    summary.current_nights !== null &&
    summary.nights_to_next !== null;
  const pct =
    hasProgress && summary.threshold
      ? Math.min(100, Math.round(((summary.current_nights ?? 0) / summary.threshold) * 100))
      : 0;
  const readyForAward = hasProgress && (summary.nights_to_next ?? 1) <= 0;

  return (
    <div
      className="mt-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-border md:p-10"
      data-testid="free-night-summary"
    >
      <h2 className="font-primary text-[28px] italic text-green-dark">
        {t('membership.free_night_title')}
      </h2>
      {descKey && <p className="mt-2 text-[14px] leading-relaxed text-gray-text">{t(descKey)}</p>}

      {hasProgress && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-[13px] font-semibold text-green-dark">
            <span>
              {t('membership.free_night_progress_label')
                .replace('{current}', String(summary.current_nights ?? 0))
                .replace('{threshold}', String(summary.threshold ?? 0))}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-light ring-1 ring-gray-border">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${pct}%` }}
              data-testid="free-night-progress-bar"
            />
          </div>
          <p className="mt-2 text-[13px] text-gray-text">
            {readyForAward
              ? t('membership.free_night_ready')
              : t('membership.free_night_to_next').replace(
                  '{count}',
                  String(summary.nights_to_next ?? 0),
                )}
          </p>
        </div>
      )}

      {summary.awarded.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[11px] font-semibold uppercase tracking-[3px] text-gold">
            {t('membership.free_night_awarded_title')}
          </h3>
          <ul className="mt-3 space-y-2.5" data-testid="free-night-awarded-list">
            {summary.awarded.map((night) => (
              <li
                key={night.id}
                className="flex items-center justify-between rounded-lg bg-gray-light px-4 py-3"
              >
                <span className="text-[13px] text-gray-text">
                  {t('membership.free_night_awarded_on').replace(
                    '{date}',
                    formatDate(night.awarded_at ?? night.created_at, en),
                  )}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[2px] ${
                    night.status === 'awarded'
                      ? 'bg-gold text-white'
                      : 'bg-green-dark/10 text-green-dark'
                  }`}
                >
                  {t(statusKey(night.status))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-[12px] leading-relaxed text-gray-text">
        {t('membership.free_night_concierge_note')}
      </p>
    </div>
  );
}
