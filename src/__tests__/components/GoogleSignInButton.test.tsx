import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import enTranslations from '@/translations/en.json';

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

describe('GoogleSignInButton', () => {
  it('renders the branded button with the i18n label and logo', () => {
    render(<GoogleSignInButton onClick={vi.fn()} />);
    const button = screen.getByTestId('google-signin-button');
    expect(button.textContent).toContain('Continue with Google');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('invokes onClick to start the redirect flow', () => {
    const onClick = vi.fn();
    render(<GoogleSignInButton onClick={onClick} />);
    fireEvent.click(screen.getByTestId('google-signin-button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onClick when disabled', () => {
    const onClick = vi.fn();
    render(<GoogleSignInButton onClick={onClick} disabled />);
    fireEvent.click(screen.getByTestId('google-signin-button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
