import { describe, expect, it } from 'vitest';
import {
  buildAndroidIntentUrl,
  buildKakaoExternalUrl,
  detectInAppBrowser,
} from '@/lib/in-app-browser';

// Representative real-world user agent strings.
const UA = {
  kakaoAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-G991N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.0.0 Mobile Safari/537.36;KAKAOTALK/10.3.0',
  kakaoIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.3.0',
  naverAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-S908N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.10.5)',
  naverIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 NAVER(inapp; search; 1000; 12.10.5; 14PROMAX)',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 295.0.0.32.119 (iPhone15,3; iOS 16_6; en_US; en; scale=3.00; 1290x2796; 504708567)',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/430.0.0.36.116;FBBV/535554837;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/16.6;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-G991N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/430.0.0.24.107;]',
  lineIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.12.0',
  daumAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-G991N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.0.0 Mobile Safari/537.36 DaumApps/9.5.5 DaumDevice/mobile',
  mobileSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  desktopSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
};

describe('detectInAppBrowser', () => {
  it('detects KakaoTalk on Android', () => {
    expect(detectInAppBrowser(UA.kakaoAndroid)).toEqual({
      inApp: true,
      app: 'kakaotalk',
      os: 'android',
    });
  });

  it('detects KakaoTalk on iOS', () => {
    expect(detectInAppBrowser(UA.kakaoIos)).toEqual({
      inApp: true,
      app: 'kakaotalk',
      os: 'ios',
    });
  });

  it('detects the Naver app on Android and iOS', () => {
    expect(detectInAppBrowser(UA.naverAndroid)).toEqual({
      inApp: true,
      app: 'naver',
      os: 'android',
    });
    expect(detectInAppBrowser(UA.naverIos)).toEqual({
      inApp: true,
      app: 'naver',
      os: 'ios',
    });
  });

  it('detects Instagram', () => {
    expect(detectInAppBrowser(UA.instagramIos)).toEqual({
      inApp: true,
      app: 'instagram',
      os: 'ios',
    });
  });

  it('detects Facebook via FBAN/FBAV tokens', () => {
    expect(detectInAppBrowser(UA.facebookIos)).toEqual({
      inApp: true,
      app: 'facebook',
      os: 'ios',
    });
    expect(detectInAppBrowser(UA.facebookAndroid)).toEqual({
      inApp: true,
      app: 'facebook',
      os: 'android',
    });
  });

  it('detects Line', () => {
    expect(detectInAppBrowser(UA.lineIos)).toEqual({
      inApp: true,
      app: 'line',
      os: 'ios',
    });
  });

  it('detects Daum apps', () => {
    expect(detectInAppBrowser(UA.daumAndroid)).toEqual({
      inApp: true,
      app: 'daum',
      os: 'android',
    });
  });

  it('does NOT flag mobile Safari on iOS', () => {
    expect(detectInAppBrowser(UA.mobileSafari)).toEqual({ inApp: false, os: 'ios' });
  });

  it('does NOT flag Chrome on Android', () => {
    expect(detectInAppBrowser(UA.chromeAndroid)).toEqual({ inApp: false, os: 'android' });
  });

  it('does NOT flag desktop browsers', () => {
    expect(detectInAppBrowser(UA.desktopChrome)).toEqual({ inApp: false, os: 'other' });
    expect(detectInAppBrowser(UA.desktopSafari)).toEqual({ inApp: false, os: 'other' });
  });

  it('does NOT let "Outline/" satisfy the Line signature', () => {
    expect(
      detectInAppBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Outline/1.0',
      ),
    ).toEqual({ inApp: false, os: 'other' });
  });

  it('returns the safe negative result for an empty UA (SSR guard)', () => {
    expect(detectInAppBrowser('')).toEqual({ inApp: false, os: 'other' });
  });
});

describe('buildKakaoExternalUrl', () => {
  it('encodes the current URL into the openExternal scheme', () => {
    expect(buildKakaoExternalUrl('https://www.travelinyourpocket.com/sign-in?ref=ABCD')).toBe(
      'kakaotalk://web/openExternal?url=https%3A%2F%2Fwww.travelinyourpocket.com%2Fsign-in%3Fref%3DABCD',
    );
  });
});

describe('buildAndroidIntentUrl', () => {
  it('builds a Chrome intent URL preserving host, path and query', () => {
    expect(buildAndroidIntentUrl('https://www.travelinyourpocket.com/sign-in?ref=ABCD')).toBe(
      'intent://www.travelinyourpocket.com/sign-in?ref=ABCD#Intent;scheme=https;package=com.android.chrome;end',
    );
  });

  it('handles a bare path with no query string', () => {
    expect(buildAndroidIntentUrl('http://localhost:3000/register')).toBe(
      'intent://localhost:3000/register#Intent;scheme=https;package=com.android.chrome;end',
    );
  });
});
