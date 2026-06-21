'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { startGoogleRedirect } from '@/lib/google-oauth';
import { startSocialRedirect } from '@/lib/social-oauth';
import type { SocialProvider } from '@/lib/social-oauth';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '';
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');

  // The modal has no referral / return-to context — start the full-page
  // redirect with neutral defaults (SMA-114). The /auth/{provider}/callback
  // page completes the exchange + session and lands the user on /my-page.
  const handleGoogleClick = () => {
    startGoogleRedirect({
      clientId: GOOGLE_CLIENT_ID,
      returnTo: '',
      ref: null,
      from: 'sign-in',
    });
  };

  const handleSocialClick = (provider: SocialProvider) => {
    startSocialRedirect({
      provider,
      clientId: provider === 'kakao' ? KAKAO_REST_API_KEY : NAVER_CLIENT_ID,
      returnTo: '',
      ref: null,
      from: 'sign-in',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6 p-6 pb-6 md:p-8 md:pb-6">
          <div className="text-center">
            <h2 className="font-primary text-[22px] font-bold text-green-dark">
              {t('signin_modal.title')}
            </h2>
            <p className="mt-2 text-[14px] text-gray-500">{t('signin_modal.subtitle')}</p>
          </div>

          {/* Social Login (SMA-114): wired to the full-page redirect flow. */}
          <div className="flex justify-center gap-3">
            {GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={handleGoogleClick}
                aria-label={t('auth.continue_with_google')}
                data-testid="modal-google-signin"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>
            )}
            {KAKAO_REST_API_KEY && (
              <button
                type="button"
                onClick={() => handleSocialClick('kakao')}
                aria-label={t('auth.continue_with_kakao')}
                data-testid="modal-kakao-signin"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] transition-opacity hover:opacity-90"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#191600"
                    d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.9 5.33 4.76 6.74-.2.7-.74 2.62-.85 3.03-.13.5.18.5.39.36.16-.11 2.5-1.7 3.52-2.4.71.1 1.44.16 2.18.16 5.52 0 10-3.58 10-8S17.52 3 12 3z"
                  />
                </svg>
              </button>
            )}
            {NAVER_CLIENT_ID && (
              <button
                type="button"
                onClick={() => handleSocialClick('naver')}
                aria-label={t('auth.continue_with_naver')}
                data-testid="modal-naver-signin"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#03C75A] transition-opacity hover:opacity-90"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#FFFFFF"
                    d="M16.27 12.84 7.38 0H0v24h7.73V11.16L16.62 24H24V0h-7.73v12.84z"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[12px] text-gray-400">{t('signin_modal.or')}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Email Input */}
          <div>
            <label className="mb-2 block text-[12px] font-medium text-gray-600">
              {t('signin_modal.email_label')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('signin_modal.email_placeholder')}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-[14px] text-green-dark outline-none transition-colors focus:border-green-dark"
            />
          </div>

          {/* Continue Button */}
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-dark text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
            {t('signin_modal.continue')}
            <span className="icon-lucide">&#xe817;</span>
          </button>
        </div>

        {/* Sign Up Row */}
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-4">
          <span className="text-[14px] text-gray-500">{t('signin_modal.no_account')}</span>
          <button className="text-[14px] font-semibold text-green-dark hover:underline">
            {t('signin_modal.sign_up')}
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 border-t border-gray-100 bg-gray-50 py-4">
          <span className="text-[12px] text-gray-400">{t('signin_modal.secured_by')}</span>
          <span className="text-[12px] font-medium text-gold">{t('signin_modal.dev_mode')}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
        >
          <span className="icon-lucide text-sm">&#xe8db;</span>
        </button>
      </div>
    </div>
  );
}
