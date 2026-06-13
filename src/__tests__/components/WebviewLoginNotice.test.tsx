import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WebviewLoginNotice from '@/components/auth/WebviewLoginNotice';
import type { InAppBrowserInfo } from '@/lib/in-app-browser';

const KAKAO_ANDROID: InAppBrowserInfo = { inApp: true, app: 'kakaotalk', os: 'android' };
const KAKAO_IOS: InAppBrowserInfo = { inApp: true, app: 'kakaotalk', os: 'ios' };
const NAVER_ANDROID: InAppBrowserInfo = { inApp: true, app: 'naver', os: 'android' };
const INSTAGRAM_IOS: InAppBrowserInfo = { inApp: true, app: 'instagram', os: 'ios' };

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('WebviewLoginNotice', () => {
  it('renders the notice copy and the email-login hint', () => {
    render(<WebviewLoginNotice info={KAKAO_ANDROID} />);
    expect(screen.getByTestId('webview-login-notice')).toBeTruthy();
    expect(screen.getByText("Google sign-in isn't available in this app")).toBeTruthy();
  });

  it('offers the kakaotalk://web/openExternal escape hatch inside KakaoTalk (Android + iOS)', () => {
    const expectedHref = `kakaotalk://web/openExternal?url=${encodeURIComponent(
      window.location.href,
    )}`;

    render(<WebviewLoginNotice info={KAKAO_ANDROID} />);
    expect(screen.getByTestId('webview-open-external').getAttribute('href')).toBe(expectedHref);
    cleanup();

    render(<WebviewLoginNotice info={KAKAO_IOS} />);
    expect(screen.getByTestId('webview-open-external').getAttribute('href')).toBe(expectedHref);
  });

  it('offers a Chrome intent:// escape hatch on other Android webviews', () => {
    render(<WebviewLoginNotice info={NAVER_ANDROID} />);
    const href = screen.getByTestId('webview-open-external').getAttribute('href');
    expect(href?.startsWith('intent://')).toBe(true);
    expect(href?.endsWith('#Intent;scheme=https;package=com.android.chrome;end')).toBe(true);
  });

  it('shows only instructions + copy link on iOS non-Kakao webviews', () => {
    render(<WebviewLoginNotice info={INSTAGRAM_IOS} />);
    expect(screen.queryByTestId('webview-open-external')).toBeNull();
    expect(screen.getByText(/copy the link below/i)).toBeTruthy();
    expect(screen.getByTestId('webview-copy-link')).toBeTruthy();
  });

  it('copies the current URL via the clipboard API and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<WebviewLoginNotice info={KAKAO_ANDROID} />);
    fireEvent.click(screen.getByTestId('webview-copy-link'));

    expect(await screen.findByText('Link copied')).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('falls back to a selectable URL input when no copy mechanism works', async () => {
    // jsdom has neither navigator.clipboard nor document.execCommand, which
    // mirrors an old webview where both copy paths fail.
    render(<WebviewLoginNotice info={INSTAGRAM_IOS} />);
    fireEvent.click(screen.getByTestId('webview-copy-link'));

    const fallback = (await screen.findByTestId('webview-link-fallback')) as HTMLInputElement;
    expect(fallback.value).toBe(window.location.href);
  });
});
