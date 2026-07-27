'use client';

import { useEffect, useState } from 'react';

type GlobalErrorLang = 'en' | 'kr';

/**
 * Inlined strings — this boundary renders ABOVE `LanguageProvider`, so it
 * cannot use `useLanguage()`/`t()`. These are the AC-excepted strings.
 */
const STRINGS: Record<GlobalErrorLang, Record<string, string>> = {
  en: {
    title: 'Something went wrong',
    body: 'The application ran into an unexpected problem. Reloading usually fixes it.',
    tryAgain: 'Try again',
    reload: 'Reload page',
  },
  kr: {
    title: '문제가 발생했어요',
    body: '앱에서 예상치 못한 문제가 발생했어요. 새로고침하면 대부분 해결됩니다.',
    tryAgain: '다시 시도',
    reload: '페이지 새로고침',
  },
};

/**
 * Pick the language client-side from the same signals the app uses, without
 * depending on any provider: localStorage `tip-lang` (the real key the app
 * writes — see `LanguageContext`), then `navigator.language`. Defaults to KR
 * (the FE static default) to match the rest of the app.
 */
function pickLang(): GlobalErrorLang {
  if (typeof window === 'undefined') return 'kr';
  const saved = window.localStorage.getItem('tip-lang');
  if (saved === 'en' || saved === 'kr') return saved;
  const nav = window.navigator.language?.toLowerCase() ?? '';
  if (nav === 'ko' || nav.startsWith('ko-') || nav === 'kr' || nav.startsWith('kr-')) {
    return 'kr';
  }
  return nav ? 'en' : 'kr';
}

const RELOAD_GUARD_KEY = 'chunk-reloaded';

function isChunkLoadError(error: { name?: string; message?: string }): boolean {
  if (error.name === 'ChunkLoadError') return true;
  return /Loading chunk [\d]+ failed/.test(error.message ?? '');
}

/**
 * Root-layout error boundary. Catches failures in the root layout itself
 * (above every provider), so it must render its own <html>/<body> and stay
 * dependency-free. Bilingual via inlined strings + a client-side language
 * pick; includes its own guarded chunk-error auto-reload.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<GlobalErrorLang>('kr');

  useEffect(() => {
    // Post-mount reconciliation of the language from client-only signals
    // (localStorage + navigator), mirroring LanguageContext. Runs once after
    // the first paint, so it never causes a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(pickLang());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isChunkLoadError(error)) {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_GUARD_KEY) === 'true';
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_GUARD_KEY, 'true');
        window.location.reload();
        return;
      }
    }
    window.sessionStorage.removeItem(RELOAD_GUARD_KEY);
  }, [error]);

  const s = STRINGS[lang];
  const htmlLang = lang === 'kr' ? 'ko' : 'en';

  return (
    <html lang={htmlLang}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#FAF9F7',
          color: '#1E3D2F',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>{s.title}</h1>
        <p style={{ marginTop: '1rem', maxWidth: '28rem', color: '#888888' }}>{s.body}</p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: '9999px',
              backgroundColor: '#1E3D2F',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 2rem',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {s.tryAgain}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              color: '#1E3D2F',
              border: '1px solid #1E3D2F',
              padding: '0.75rem 2rem',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {s.reload}
          </button>
        </div>
      </body>
    </html>
  );
}
