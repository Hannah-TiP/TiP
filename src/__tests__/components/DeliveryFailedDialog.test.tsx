import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import krTranslations from '@/translations/kr.json';
import DeliveryFailedDialog from '@/components/DeliveryFailedDialog';

// File-local language mock with a switchable lang (overrides the global
// EN-only mock from setup-language.ts) so we can assert both catalogs.
let currentLang: 'en' | 'kr' = 'en';
const catalogs: Record<'en' | 'kr', Record<string, string>> = {
  en: enTranslations,
  kr: krTranslations,
};

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: currentLang,
    setLang: vi.fn(),
    t: (key: string) => catalogs[currentLang][key] ?? key,
  }),
}));

beforeEach(() => {
  currentLang = 'en';
});

afterEach(() => {
  cleanup();
});

function renderDialog(props: Partial<React.ComponentProps<typeof DeliveryFailedDialog>> = {}) {
  return render(
    <DeliveryFailedDialog
      isOpen
      email="user@hanmail.net"
      onUseDifferentEmail={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

describe('DeliveryFailedDialog', () => {
  it('renders nothing when closed', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByTestId('delivery-failed-dialog')).toBeNull();
  });

  it('renders the EN copy with the email interpolated', () => {
    renderDialog();

    expect(screen.getByText(enTranslations['delivery_failed.title'])).toBeTruthy();
    expect(
      screen.getByText(
        enTranslations['delivery_failed.body'].replace('{email}', 'user@hanmail.net'),
      ),
    ).toBeTruthy();
    expect(screen.getByText(enTranslations['delivery_failed.kr_isp_note'])).toBeTruthy();
    expect(screen.getByTestId('delivery-failed-use-different-email').textContent).toBe(
      enTranslations['delivery_failed.use_different_email'],
    );
  });

  it('renders the KR copy when the language is Korean', () => {
    currentLang = 'kr';
    renderDialog();

    expect(screen.getByText(krTranslations['delivery_failed.title'])).toBeTruthy();
    expect(
      screen.getByText(
        krTranslations['delivery_failed.body'].replace('{email}', 'user@hanmail.net'),
      ),
    ).toBeTruthy();
    expect(screen.getByText(krTranslations['delivery_failed.kr_isp_note'])).toBeTruthy();
    expect(screen.getByTestId('delivery-failed-use-different-email').textContent).toBe(
      krTranslations['delivery_failed.use_different_email'],
    );
  });

  it('fires onUseDifferentEmail when the retry CTA is clicked', () => {
    const onUseDifferentEmail = vi.fn();
    renderDialog({ onUseDifferentEmail });

    fireEvent.click(screen.getByTestId('delivery-failed-use-different-email'));
    expect(onUseDifferentEmail).toHaveBeenCalledTimes(1);
  });

  it('fires onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
