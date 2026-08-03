import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import enTranslations from '@/translations/en.json';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { installMockLocalStorage } from '@/__tests__/helpers/mock-local-storage';

installMockLocalStorage();

const en = enTranslations as Record<string, string>;

const deleteAccountMock = vi.fn();
const sendVerificationCodeMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
    sendVerificationCode: (...args: unknown[]) => sendVerificationCodeMock(...args),
  },
}));

vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] ?? key,
    lang: 'en',
    setLang: () => {},
  }),
}));

const SUCCESS_RESPONSE = {
  deletion_requested_at: '2026-07-30T09:00:00Z',
  purge_after: '2026-08-29T09:00:00Z',
};

function renderModal(overrides: Partial<{ hasPassword: boolean; open: boolean }> = {}) {
  return render(
    <DeleteAccountModal
      open={overrides.open ?? true}
      onClose={vi.fn()}
      email="user@example.com"
      hasPassword={overrides.hasPassword ?? true}
    />,
  );
}

beforeEach(() => {
  deleteAccountMock.mockReset();
  sendVerificationCodeMock.mockReset();
  signOutMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('DeleteAccountModal', () => {
  it('discloses deleted vs retained data before confirming', () => {
    renderModal();
    for (const key of [
      'account.delete.disclosure_intro',
      'account.delete.disclosure_deleted',
      'account.delete.disclosure_retained_intro',
      'account.delete.disclosure_retained_financial',
      'account.delete.disclosure_retained_disputes',
      'account.delete.disclosure_grace',
      'account.delete.disclosure_irreversible',
    ]) {
      expect(screen.getByText(en[key])).toBeTruthy();
    }
  });

  it('password accounts see the password field and no send-code button', () => {
    renderModal({ hasPassword: true });
    expect(screen.getByTestId('delete-password-input')).toBeTruthy();
    expect(screen.queryByTestId('delete-code-input')).toBeNull();
    expect(screen.queryByTestId('send-code-button')).toBeNull();
  });

  it('requires re-auth AND the explicit confirm checkbox before submit enables', () => {
    renderModal({ hasPassword: true });
    const submit = screen.getByTestId('delete-account-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByTestId('delete-password-input'), {
      target: { value: 'hunter22' },
    });
    // Password alone is not enough — the confirm step is explicit.
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    expect(submit.disabled).toBe(false);

    // Unchecking re-disables it.
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    expect(submit.disabled).toBe(true);
  });

  it('social-only accounts re-auth with a fresh email OTP', async () => {
    sendVerificationCodeMock.mockResolvedValueOnce({ success: true });
    deleteAccountMock.mockResolvedValueOnce(SUCCESS_RESPONSE);
    renderModal({ hasPassword: false });

    expect(screen.queryByTestId('delete-password-input')).toBeNull();

    fireEvent.click(screen.getByTestId('send-code-button'));
    expect(sendVerificationCodeMock).toHaveBeenCalledWith(
      'user@example.com',
      'account_deletion',
      'en',
    );
    await screen.findByTestId('delete-code-sent');

    fireEvent.change(screen.getByTestId('delete-code-input'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    fireEvent.click(screen.getByTestId('delete-account-submit'));

    await screen.findByTestId('delete-account-success');
    expect(deleteAccountMock).toHaveBeenCalledWith({ verification_code: '123456' }, 'en');
  });

  it('surfaces a send-code failure with the i18n message', async () => {
    sendVerificationCodeMock.mockRejectedValueOnce(new Error('boom'));
    renderModal({ hasPassword: false });

    fireEvent.click(screen.getByTestId('send-code-button'));

    const error = await screen.findByTestId('delete-account-error');
    expect(error.textContent).toBe(en['delete_account.error_send_code']);
  });

  it('on success shows grace-period messaging, then OK clears exactly the four key families and signs out', async () => {
    deleteAccountMock.mockResolvedValueOnce(SUCCESS_RESPONSE);
    localStorage.setItem('tip-lang', 'kr');
    localStorage.setItem('concierge_active_session_id', '42');
    localStorage.setItem('tip-review-drafts:7', '{}');
    localStorage.setItem('tip-review-skips:7', '{}');
    localStorage.setItem('tip-cookie-consent', 'accepted');
    localStorage.setItem('tiyp_popup_dismiss_until_v2_en', '123');

    renderModal({ hasPassword: true });
    fireEvent.change(screen.getByTestId('delete-password-input'), {
      target: { value: 'hunter22' },
    });
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    fireEvent.click(screen.getByTestId('delete-account-submit'));

    const successPanel = await screen.findByTestId('delete-account-success');
    expect(deleteAccountMock).toHaveBeenCalledWith({ password: 'hunter22' }, 'en');
    expect(successPanel.textContent).toContain(en['delete_account.success_message']);
    // Nothing is cleared and no sign-out happens until the user acknowledges.
    expect(signOutMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('tip-lang')).toBe('kr');

    fireEvent.click(screen.getByTestId('delete-success-ok'));

    expect(localStorage.getItem('tip-lang')).toBeNull();
    expect(localStorage.getItem('concierge_active_session_id')).toBeNull();
    expect(localStorage.getItem('tip-review-drafts:7')).toBeNull();
    expect(localStorage.getItem('tip-review-skips:7')).toBeNull();
    // Device-level preferences are explicitly left untouched.
    expect(localStorage.getItem('tip-cookie-consent')).toBe('accepted');
    expect(localStorage.getItem('tiyp_popup_dismiss_until_v2_en')).toBe('123');
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('closing the modal from the success state also clears state and signs out', async () => {
    deleteAccountMock.mockResolvedValueOnce(SUCCESS_RESPONSE);
    localStorage.setItem('tip-lang', 'en');

    renderModal({ hasPassword: true });
    fireEvent.change(screen.getByTestId('delete-password-input'), {
      target: { value: 'hunter22' },
    });
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    fireEvent.click(screen.getByTestId('delete-account-submit'));
    await screen.findByTestId('delete-account-success');

    fireEvent.click(screen.getByTestId('modal-close'));

    expect(localStorage.getItem('tip-lang')).toBeNull();
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('surfaces the localized backend re-auth error (wrong password / wrong OTP / already processed)', async () => {
    deleteAccountMock.mockRejectedValueOnce(new Error('Current password is incorrect'));
    renderModal({ hasPassword: true });

    fireEvent.change(screen.getByTestId('delete-password-input'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    fireEvent.click(screen.getByTestId('delete-account-submit'));

    const error = await screen.findByTestId('delete-account-error');
    expect(error.textContent).toBe('Current password is incorrect');
    expect(signOutMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-account-success')).toBeNull();
  });

  it('maps a network failure to the i18n network-error message', async () => {
    deleteAccountMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderModal({ hasPassword: true });

    fireEvent.change(screen.getByTestId('delete-password-input'), { target: { value: 'x' } });
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    fireEvent.click(screen.getByTestId('delete-account-submit'));

    const error = await screen.findByTestId('delete-account-error');
    expect(error.textContent).toBe(en['delete_account.error_network']);
  });

  it('falls back to the generic i18n error when no backend message is available', async () => {
    deleteAccountMock.mockRejectedValueOnce(new Error('Request failed'));
    renderModal({ hasPassword: true });

    fireEvent.change(screen.getByTestId('delete-password-input'), { target: { value: 'x' } });
    fireEvent.click(screen.getByTestId('delete-confirm-checkbox'));
    fireEvent.click(screen.getByTestId('delete-account-submit'));

    const error = await screen.findByTestId('delete-account-error');
    expect(error.textContent).toBe(en['delete_account.error_generic']);
  });
});
