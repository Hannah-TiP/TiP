'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { useBenefits } from '@/hooks/useBenefits';
import { MEMBERSHIP_TIER_NAMES, resolvedBenefitPoints } from '@/lib/benefits';
import { formatDate as formatDateI18n } from '@/lib/format-date';
import { formatPoints } from '@/lib/points-wallet';
import { apiClient } from '@/lib/api-client';
import type { MyReferralsResponse } from '@/types/stay-credit';

function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  return formatDateI18n(ms, lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyReferralsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { lang, t } = useLanguage();
  // The joiner reward keys off the REFERRER's (this member's) tier — read
  // from the registry's `resolved` block (SMA-358), never a literal. Null
  // (anonymous / endpoint down) degrades to figure-free copy.
  const benefits = useBenefits();
  const joinerPoints = resolvedBenefitPoints(benefits, 'referral_joiner_credit');
  const tierName = benefits?.resolved ? MEMBERSHIP_TIER_NAMES[benefits.resolved.tier] : null;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyReferralsResponse | null>(null);
  // null = no error; '' = failed with no server message (localized fallback
  // is resolved at render time).
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }
    if (status !== 'authenticated') return;
    let cancelled = false;
    apiClient
      .getMyReferrals()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message ?? '');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const shareLink = useMemo(() => {
    if (!data?.code) return '';
    if (typeof window === 'undefined') return `?ref=${data.code}`;
    return `${window.location.origin}/register?ref=${data.code}`;
  }, [data?.code]);

  async function copyToClipboard(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Browser blocked clipboard — fall back to a transient hint.
      setCopied(false);
    }
  }

  const intro =
    joinerPoints !== null && tierName
      ? t('referrals.intro_points')
          .replace('{tier}', tierName)
          .replace('{points}', formatPoints(joinerPoints))
      : t('referrals.intro');

  return (
    <>
      <main className="min-h-[80vh] bg-[#FAF9F7]">
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold tracking-[4px] text-[#C4956A]">
              {t('referrals.eyebrow')}
            </span>
            <h1 className="mt-3 font-primary text-[42px] italic leading-tight text-[#1E3D2F] md:text-[52px]">
              {t('referrals.title')}
            </h1>
            <p
              className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600"
              data-testid="referrals-intro"
            >
              {intro}
            </p>
          </div>

          {/* Code + share link */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 mb-10">
            {loading ? (
              <div className="text-center text-gray-500 text-sm py-6">
                {t('referrals.loading_code')}
              </div>
            ) : error !== null ? (
              <div className="text-center text-rose-600 text-sm py-6">
                {error || t('referrals.error_load')}
              </div>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-[3px] text-[#C4956A]">
                  {t('referrals.your_code')}
                </div>
                <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <span className="font-mono text-[36px] tracking-[4px] text-[#1E3D2F]">
                    {data?.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(data?.code ?? '')}
                    className="self-start md:self-auto rounded-full bg-[#1E3D2F] px-5 py-2 text-[12px] font-semibold uppercase tracking-[2px] text-white hover:bg-[#2a5240] transition-colors"
                  >
                    {copied ? t('referrals.copied') : t('referrals.copy_code')}
                  </button>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="text-[11px] uppercase tracking-[3px] text-[#C4956A]">
                    {t('referrals.share_link')}
                  </div>
                  <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <span className="font-mono text-[13px] text-gray-700 break-all">
                      {shareLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shareLink)}
                      className="self-start md:self-auto rounded-full border border-[#1E3D2F] px-5 py-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#1E3D2F] hover:bg-[#1E3D2F] hover:text-white transition-colors"
                    >
                      {t('referrals.copy_link')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* History */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-primary text-[26px] italic text-[#1E3D2F]">
              {t('referrals.history_title')}
            </h2>

            {loading ? (
              <div className="mt-6 text-center text-gray-500 text-sm">{t('referrals.loading')}</div>
            ) : data && data.referrals.length === 0 ? (
              <div className="mt-6 text-center text-gray-500 text-sm">{t('referrals.empty')}</div>
            ) : data ? (
              <div className="mt-6 divide-y divide-gray-100">
                {data.referrals.map((ref) => (
                  <div key={ref.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900 text-[14px]">
                        {t('referrals.friend')} #{ref.referee_user_id}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {formatDate(ref.claimed_at, lang)}
                      </div>
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {ref.referee_credit_id ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 font-semibold">
                          {t('referrals.status_points_sent')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500 font-semibold">
                          {t('referrals.status_joined')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <p className="mt-10 text-center text-[12px] text-gray-500">{t('referrals.footnote')}</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
