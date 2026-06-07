'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiClient } from '@/lib/api-client';
import type { MyReferralsResponse } from '@/types/stay-credit';

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

export default function MyReferralsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { lang } = useLanguage();
  const en = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyReferralsResponse | null>(null);
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
        setError(err.message || 'Could not load referrals.');
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

  return (
    <>
      <main className="min-h-[80vh] bg-[#FAF9F7]">
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-semibold tracking-[4px] text-[#C4956A]">
              {en ? 'TIP MEMBERSHIP' : 'TIP 멤버십'}
            </span>
            <h1 className="mt-3 font-primary text-[42px] italic leading-tight text-[#1E3D2F] md:text-[52px]">
              {en ? 'Refer a friend' : '친구 추천하기'}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600">
              {en
                ? 'The friend you invite receives a stay credit when they join through your code. Your invite is worth $150 as a Carte member, or $300 as a Cercle, Confidence, or Cénacle member.'
                : '추천 코드로 가입한 친구에게 스테이 크레딧이 적립됩니다. Carte 멤버의 추천은 $150, Cercle · Confidence · Cénacle 멤버의 추천은 $300의 가치가 있습니다.'}
            </p>
          </div>

          {/* Code + share link */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 mb-10">
            {loading ? (
              <div className="text-center text-gray-500 text-sm py-6">
                {en ? 'Loading your code…' : '코드를 불러오는 중…'}
              </div>
            ) : error ? (
              <div className="text-center text-rose-600 text-sm py-6">{error}</div>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-[3px] text-[#C4956A]">
                  {en ? 'Your referral code' : '추천 코드'}
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
                    {copied ? (en ? 'Copied' : '복사됨') : en ? 'Copy code' : '코드 복사'}
                  </button>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="text-[11px] uppercase tracking-[3px] text-[#C4956A]">
                    {en ? 'Share link' : '공유 링크'}
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
                      {en ? 'Copy link' : '링크 복사'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* History */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-primary text-[26px] italic text-[#1E3D2F]">
              {en ? 'People you referred' : '내가 추천한 분들'}
            </h2>

            {loading ? (
              <div className="mt-6 text-center text-gray-500 text-sm">
                {en ? 'Loading…' : '불러오는 중…'}
              </div>
            ) : data && data.referrals.length === 0 ? (
              <div className="mt-6 text-center text-gray-500 text-sm">
                {en
                  ? 'No referrals yet. Share your code with someone you love to travel with.'
                  : '아직 추천 기록이 없습니다. 함께 여행하고 싶은 분께 코드를 공유해보세요.'}
              </div>
            ) : data ? (
              <div className="mt-6 divide-y divide-gray-100">
                {data.referrals.map((ref) => (
                  <div key={ref.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900 text-[14px]">
                        {en ? 'Friend' : '추천한 친구'} #{ref.referee_user_id}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {formatDate(ref.claimed_at, en ? 'en-US' : 'ko-KR')}
                      </div>
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {ref.referee_credit_id ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 font-semibold">
                          {en ? 'Credit sent' : '크레딧 전달'}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500 font-semibold">
                          {en ? 'Joined' : '가입 완료'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
