'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCookieConsent, type CookiePreferences } from '@/hooks/useCookieConsent';

type Bilingual = { en: string; kr: string };

/** Dispatched by the Footer "Cookie Settings" link to re-open the modal. */
export const OPEN_COOKIE_SETTINGS_EVENT = 'open-cookie-settings';

const COPY = {
  banner: {
    title: {
      en: 'We value your privacy',
      kr: '개인정보를 소중히 여깁니다',
    },
    description: {
      en: 'We use cookies to enhance your browsing experience and analyze site traffic. You can choose which categories of cookies you allow.',
      kr: '쿠키를 사용하여 브라우징 경험을 향상하고 사이트 트래픽을 분석합니다. 허용할 쿠키 카테고리를 선택할 수 있습니다.',
    },
    acceptAll: { en: 'Accept All', kr: '모두 수락' },
    managePreferences: {
      en: 'Manage Preferences',
      kr: '환경설정 관리',
    },
  },
  modal: {
    title: { en: 'Cookie Preferences', kr: '쿠키 환경설정' },
    description: {
      en: 'Choose which cookies you would like to allow. You can change these settings at any time from the footer.',
      kr: '허용할 쿠키를 선택하세요. 이 설정은 페이지 하단에서 언제든 변경할 수 있습니다.',
    },
    necessary: {
      title: { en: 'Necessary', kr: '필수 쿠키' },
      description: {
        en: 'Essential for the website to function. These cookies enable core functionality such as security, session management, and accessibility. They cannot be disabled.',
        kr: '웹사이트 작동에 필수적인 쿠키입니다. 보안, 세션 관리, 접근성 등 핵심 기능을 지원하며 비활성화할 수 없습니다.',
      },
    },
    analytics: {
      title: { en: 'Analytics', kr: '분석 쿠키' },
      description: {
        en: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously.',
        kr: '방문자가 웹사이트와 상호작용하는 방식을 이해하기 위해 익명으로 정보를 수집하고 보고합니다.',
      },
    },
    marketing: {
      title: { en: 'Marketing', kr: '마케팅 쿠키' },
      description: {
        en: 'Used to deliver personalized advertisements and measure the effectiveness of advertising campaigns.',
        kr: '맞춤형 광고를 제공하고 광고 캠페인의 효과를 측정하는 데 사용됩니다.',
      },
    },
    savePreferences: { en: 'Save Preferences', kr: '설정 저장' },
  },
};

function L({ s, isEn }: { s: Bilingual; isEn: boolean }) {
  return <>{s[isEn ? 'en' : 'kr']}</>;
}

export default function CookieConsentBanner() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const consent = useCookieConsent();
  const [showModal, setShowModal] = useState(false);

  // Listen for Footer "Cookie Settings" clicks (works even after banner dismissed).
  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handler);
  }, []);

  if (!consent.showBanner && !showModal) return null;

  return (
    <>
      {/* Banner */}
      {consent.showBanner && !showModal && (
        <div
          data-testid="cookie-consent-banner"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-border bg-white px-6 py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] sm:px-10 lg:px-[100px]"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex-1">
              <h3 className="font-primary text-lg text-green-dark">
                <L s={COPY.banner.title} isEn={isEn} />
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-text">
                <L s={COPY.banner.description} isEn={isEn} />
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="h-10 rounded-full border border-green-dark/20 px-5 text-[13px] font-medium text-green-dark transition-colors hover:border-green-dark hover:bg-green-dark/5"
              >
                <L s={COPY.banner.managePreferences} isEn={isEn} />
              </button>
              <button
                type="button"
                data-testid="cookie-accept-all"
                onClick={consent.acceptAll}
                className="h-10 rounded-full bg-green-dark px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#163427]"
              >
                <L s={COPY.banner.acceptAll} isEn={isEn} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showModal && (
        <PreferencesModal
          isEn={isEn}
          initialAnalytics={consent.analytics}
          initialMarketing={consent.marketing}
          onSave={(prefs) => {
            consent.updatePreferences(prefs);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function PreferencesModal({
  isEn,
  initialAnalytics,
  initialMarketing,
  onSave,
  onClose,
}: {
  isEn: boolean;
  initialAnalytics: boolean;
  initialMarketing: boolean;
  onSave: (prefs: CookiePreferences) => void;
  onClose: () => void;
}) {
  const [analyticsOn, setAnalyticsOn] = useState(initialAnalytics);
  const [marketingOn, setMarketingOn] = useState(initialMarketing);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        data-testid="cookie-preferences-modal"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="border-b border-gray-border px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-primary text-xl text-green-dark">
              <L s={COPY.modal.title} isEn={isEn} />
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-text transition-colors hover:bg-gray-light hover:text-green-dark"
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-text">
            <L s={COPY.modal.description} isEn={isEn} />
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-0 divide-y divide-gray-border px-6">
          <CategoryRow
            isEn={isEn}
            title={COPY.modal.necessary.title}
            description={COPY.modal.necessary.description}
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
          <CategoryRow
            isEn={isEn}
            title={COPY.modal.analytics.title}
            description={COPY.modal.analytics.description}
            checked={analyticsOn}
            disabled={false}
            onChange={setAnalyticsOn}
            testId="cookie-toggle-analytics"
          />
          <CategoryRow
            isEn={isEn}
            title={COPY.modal.marketing.title}
            description={COPY.modal.marketing.description}
            checked={marketingOn}
            disabled={false}
            onChange={setMarketingOn}
            testId="cookie-toggle-marketing"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-border px-6 py-4">
          <button
            type="button"
            data-testid="cookie-save-preferences"
            onClick={() => onSave({ analytics: analyticsOn, marketing: marketingOn })}
            className="w-full rounded-full bg-green-dark py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#163427]"
          >
            <L s={COPY.modal.savePreferences} isEn={isEn} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  isEn,
  title,
  description,
  checked,
  disabled,
  onChange,
  testId,
}: {
  isEn: boolean;
  title: Bilingual;
  description: Bilingual;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex-1">
        <div className="text-[14px] font-medium text-[#1A1A18]">
          <L s={title} isEn={isEn} />
          {disabled && (
            <span className="ml-2 text-[11px] font-normal text-gray-text">
              ({isEn ? 'Always active' : '항상 활성'})
            </span>
          )}
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-gray-text">
          <L s={description} isEn={isEn} />
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          disabled
            ? 'cursor-not-allowed bg-green-dark/60'
            : checked
              ? 'cursor-pointer bg-green-dark'
              : 'cursor-pointer bg-gray-text/30'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
