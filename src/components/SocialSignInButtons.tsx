'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { SocialProvider } from '@/lib/social-oauth';

interface SocialSignInButtonsProps {
  /** Starts the full-page redirect sign-in flow for the given provider. */
  onProviderClick: (provider: SocialProvider) => void;
  /** Which provider buttons to render (a provider is shown only when its
   *  public client id/key is configured). Defaults to both. */
  providers?: SocialProvider[];
  disabled?: boolean;
}

/**
 * Branded "Continue with Kakao" / "Continue with Naver" buttons (SMA-114),
 * shown alongside the Google button on the sign-in and register pages.
 *
 * Each button drives the full-page top-level redirect auth-code flow — same
 * model as Google (SMA-133) — which avoids the iOS-Safari popup-postMessage
 * failure and works without third-party cookies.
 *
 * Colors follow each provider's brand guidelines: Kakao yellow (#FEE500) with
 * dark text; Naver green (#03C75A) with white text.
 */
export default function SocialSignInButtons({
  onProviderClick,
  providers = ['kakao', 'naver'],
  disabled,
}: SocialSignInButtonsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3">
      {providers.includes('kakao') && (
        <button
          type="button"
          onClick={() => onProviderClick('kakao')}
          disabled={disabled}
          data-testid="kakao-signin-button"
          className="flex h-10 w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-3 text-sm font-medium text-[#191600] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path
              fill="#191600"
              d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.9 5.33 4.76 6.74-.2.7-.74 2.62-.85 3.03-.13.5.18.5.39.36.16-.11 2.5-1.7 3.52-2.4.71.1 1.44.16 2.18.16 5.52 0 10-3.58 10-8S17.52 3 12 3z"
            />
          </svg>
          <span>{t('auth.continue_with_kakao')}</span>
        </button>
      )}

      {providers.includes('naver') && (
        <button
          type="button"
          onClick={() => onProviderClick('naver')}
          disabled={disabled}
          data-testid="naver-signin-button"
          className="flex h-10 w-full items-center justify-center gap-3 rounded-lg bg-[#03C75A] px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path
              fill="#FFFFFF"
              d="M16.27 12.84 7.38 0H0v24h7.73V11.16L16.62 24H24V0h-7.73v12.84z"
            />
          </svg>
          <span>{t('auth.continue_with_naver')}</span>
        </button>
      )}
    </div>
  );
}
