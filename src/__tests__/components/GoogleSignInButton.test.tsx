import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UseGoogleLoginOptionsAuthCodeFlow } from '@react-oauth/google';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import enTranslations from '@/translations/en.json';

const { loginMock, getCapturedOptions, setCapturedOptions } = vi.hoisted(() => {
  let captured: unknown = null;
  return {
    loginMock: vi.fn(),
    getCapturedOptions: () => captured as UseGoogleLoginOptionsAuthCodeFlow,
    setCapturedOptions: (options: unknown) => {
      captured = options;
    },
  };
});

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: (options: unknown) => {
    setCapturedOptions(options);
    return loginMock;
  },
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderButton(overrides: Partial<React.ComponentProps<typeof GoogleSignInButton>> = {}) {
  const props = {
    onCode: vi.fn(),
    onFailure: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<GoogleSignInButton {...props} />);
  return props;
}

describe('GoogleSignInButton', () => {
  it('renders the branded button with the i18n label', () => {
    renderButton();
    const button = screen.getByTestId('google-signin-button');
    expect(button.textContent).toContain('Continue with Google');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('uses the auth-code flow', () => {
    renderButton();
    expect(getCapturedOptions().flow).toBe('auth-code');
  });

  it('starts the popup login flow on click', () => {
    renderButton();
    fireEvent.click(screen.getByTestId('google-signin-button'));
    expect(loginMock).toHaveBeenCalledTimes(1);
  });

  it('does not start the flow when disabled', () => {
    renderButton({ disabled: true });
    fireEvent.click(screen.getByTestId('google-signin-button'));
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('passes the authorization code to onCode on success', () => {
    const props = renderButton();
    getCapturedOptions().onSuccess?.({ code: '4/0AbCdEf', scope: '' });
    expect(props.onCode).toHaveBeenCalledWith('4/0AbCdEf');
    expect(props.onFailure).not.toHaveBeenCalled();
  });

  it('calls onFailure on an OAuth error', () => {
    const props = renderButton();
    getCapturedOptions().onError?.({ error: 'access_denied' });
    expect(props.onFailure).toHaveBeenCalledTimes(1);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when the user closes the popup', () => {
    const props = renderButton();
    getCapturedOptions().onNonOAuthError?.({ type: 'popup_closed' });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onFailure).not.toHaveBeenCalled();
  });

  it('calls onFailure when the popup fails to open (e.g. blocked)', () => {
    const props = renderButton();
    getCapturedOptions().onNonOAuthError?.({ type: 'popup_failed_to_open' });
    expect(props.onFailure).toHaveBeenCalledTimes(1);
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
