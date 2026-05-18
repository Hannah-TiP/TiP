'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import {
  STAY_CREDIT_SOURCE_LABELS,
  STAY_CREDIT_STATUS_LABELS,
  type StayCredit,
} from '@/types/stay-credit';

const STATUS_PILL: Record<StayCredit['status'], string> = {
  issued: 'bg-emerald-100 text-emerald-700',
  redeemed: 'bg-blue-100 text-blue-700',
  expired: 'bg-gray-100 text-gray-500',
  revoked: 'bg-rose-100 text-rose-700',
};

function formatAmount(amountCents: number, currency: string): string {
  const dollars = (amountCents / 100).toFixed(2);
  return `${currency} ${dollars}`;
}

function formatDate(iso?: string | null, locale = 'en-US'): string {
  if (!iso) return '—';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function sumIssuedCents(credits: StayCredit[]): { cents: number; currency: string | null } {
  // Available balance is "everything currently in ISSUED state." If the user
  // ever holds credits in mixed currencies we surface the dominant currency
  // and ignore others — handling FX is out of scope for this page.
  const issued = credits.filter((c) => c.status === 'issued');
  if (issued.length === 0) return { cents: 0, currency: null };
  const counts = new Map<string, number>();
  issued.forEach((c) => counts.set(c.currency, (counts.get(c.currency) ?? 0) + 1));
  const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  const cents = issued
    .filter((c) => c.currency === dominant)
    .reduce((acc, c) => acc + c.amount_cents, 0);
  return { cents, currency: dominant };
}

export default function MyCreditsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { lang } = useLanguage();
  const en = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<StayCredit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
      return;
    }
    if (status !== 'authenticated') return;
    let cancelled = false;
    apiClient
      .getMyCredits()
      .then((rows) => {
        if (cancelled) return;
        setCredits(rows);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'Could not load credits.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const balance = sumIssuedCents(credits);

  return (
    <>
      <main className="min-h-[80vh] bg-[#FAF9F7]">
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold tracking-[4px] text-[#C4956A]">
              {en ? 'TIP MEMBERSHIP' : 'TIP 멤버십'}
            </span>
            <h1 className="mt-3 font-primary text-[42px] italic leading-tight text-[#1E3D2F] md:text-[52px]">
              {en ? 'Your Stay Credits' : '스테이 크레딧'}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600">
              {en
                ? 'Welcome gifts, birthday credits, referral rewards, and concierge gestures appear here. Credits apply automatically to qualifying TiP partner stays.'
                : '환영 크레딧, 생일 크레딧, 추천 보상, 컨시어지의 선물이 여기에 표시됩니다. 크레딧은 TiP 파트너 호텔 스테이에 자동으로 적용됩니다.'}
            </p>
          </div>

          {/* Available balance card */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 mb-10">
            <div className="text-[11px] uppercase tracking-[3px] text-[#C4956A]">
              {en ? 'Available balance' : '사용 가능한 잔액'}
            </div>
            <div className="mt-3 font-primary text-[40px] italic text-[#1E3D2F]">
              {balance.cents > 0 && balance.currency
                ? formatAmount(balance.cents, balance.currency)
                : en
                  ? 'No credits yet'
                  : '아직 적립된 크레딧이 없습니다'}
            </div>
            <div className="mt-2 text-[13px] text-gray-500">
              {en
                ? 'Includes credits in your dominant currency. Credits are not redeemable for cash.'
                : '주요 통화의 크레딧이 표시됩니다. 크레딧은 현금으로 교환할 수 없습니다.'}
            </div>
          </div>

          {/* History */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-primary text-[26px] italic text-[#1E3D2F]">
              {en ? 'Credit history' : '크레딧 내역'}
            </h2>

            {loading ? (
              <div className="mt-6 text-center text-gray-500 text-sm">
                {en ? 'Loading…' : '불러오는 중…'}
              </div>
            ) : error ? (
              <div className="mt-6 text-center text-rose-600 text-sm">{error}</div>
            ) : credits.length === 0 ? (
              <div className="mt-6 text-center text-gray-500 text-sm">
                {en
                  ? 'No credits yet. Refer a friend or your next stay may earn one.'
                  : '아직 적립된 크레딧이 없습니다. 친구를 추천하거나 다음 스테이에서 적립해보세요.'}
              </div>
            ) : (
              <div className="mt-6 divide-y divide-gray-100">
                {credits.map((credit) => (
                  <div key={credit.id} className="py-5 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 font-primary text-[22px] italic text-[#1E3D2F]">
                      {formatAmount(credit.amount_cents, credit.currency)}
                    </div>
                    <div className="col-span-3 text-[14px]">
                      <div className="font-medium text-gray-900">
                        {STAY_CREDIT_SOURCE_LABELS[credit.source][en ? 'en' : 'kr']}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {formatDate(credit.created_at, en ? 'en-US' : 'ko-KR')}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${
                          STATUS_PILL[credit.status]
                        }`}
                      >
                        {STAY_CREDIT_STATUS_LABELS[credit.status][en ? 'en' : 'kr']}
                      </span>
                    </div>
                    <div className="col-span-2 text-[12px] text-gray-500">
                      {credit.expires_at ? (
                        <>
                          <span className="block uppercase tracking-wider text-[10px] text-gray-400">
                            {en ? 'Expires' : '만료'}
                          </span>
                          {formatDate(credit.expires_at, en ? 'en-US' : 'ko-KR')}
                        </>
                      ) : (
                        <span className="italic text-gray-400">
                          {en ? 'No expiry' : '만료 없음'}
                        </span>
                      )}
                    </div>
                    <div
                      className="col-span-2 text-[12px] text-gray-500 truncate"
                      title={credit.notes ?? undefined}
                    >
                      {credit.notes || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-[12px] text-gray-500">
            {en
              ? 'Credits apply to qualifying stays at TiP partner hotels and are not redeemable for cash.'
              : '크레딧은 TiP 파트너 호텔 스테이에 적용되며 현금으로 교환할 수 없습니다.'}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
