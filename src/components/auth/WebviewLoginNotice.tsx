'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  buildAndroidIntentUrl,
  buildKakaoExternalUrl,
  type InAppBrowserInfo,
} from '@/lib/in-app-browser';

interface WebviewLoginNoticeProps {
  info: InAppBrowserInfo;
}

/**
 * Shown on /sign-in and /register in place of the GoogleLogin widget when
 * the page is loaded inside a detected in-app webview (SMA-118). Explains
 * why Google login is unavailable and offers a best-effort escape hatch to
 * the system browser, with a copy-link fallback that always renders.
 */
export default function WebviewLoginNotice({ info }: WebviewLoginNoticeProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState('');

  // This component only ever renders client-side (useInAppBrowser reports
  // "not in app" during SSR/hydration), so window is always available here.
  const currentUrl = typeof window === 'undefined' ? '' : window.location.href;
  const externalHref = !currentUrl
    ? ''
    : info.app === 'kakaotalk'
      ? // Works on both Android and iOS KakaoTalk.
        buildKakaoExternalUrl(currentUrl)
      : info.os === 'android'
        ? // Best effort on other Android webviews; may silently no-op.
          buildAndroidIntentUrl(currentUrl)
        : // iOS non-Kakao webviews have no reliable scheme — instructions
          // + copy-link only.
          '';

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      // Older webviews: clipboard API unavailable or blocked — fall through.
    }

    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let copiedViaExec = false;
    try {
      copiedViaExec = document.execCommand('copy');
    } catch {
      copiedViaExec = false;
    }
    document.body.removeChild(textarea);

    if (copiedViaExec) {
      setCopied(true);
    } else {
      // Last resort: show the URL in a selectable input.
      setFallbackUrl(url);
    }
  };

  return (
    <div
      data-testid="webview-login-notice"
      className="flex flex-col gap-3 rounded-lg bg-gold/10 p-4 text-sm"
    >
      <p className="font-medium text-green-dark">{t('auth.webview_notice_title')}</p>
      <p className="text-gray-text">{t('auth.webview_notice_body')}</p>

      {externalHref && (
        <a
          href={externalHref}
          data-testid="webview-open-external"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-green-dark text-white transition-opacity hover:opacity-90"
        >
          {t('auth.webview_open_external')}
        </a>
      )}

      <p className="text-xs text-gray-text">{t('auth.webview_ios_instructions')}</p>

      <button
        type="button"
        data-testid="webview-copy-link"
        onClick={handleCopyLink}
        className="flex h-11 w-full items-center justify-center rounded-lg border border-green-dark text-green-dark"
      >
        {copied ? t('auth.webview_link_copied') : t('auth.webview_copy_link')}
      </button>

      {fallbackUrl && (
        <input
          readOnly
          value={fallbackUrl}
          data-testid="webview-link-fallback"
          aria-label={t('auth.webview_copy_link')}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-text"
        />
      )}
    </div>
  );
}
