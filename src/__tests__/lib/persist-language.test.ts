import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    updateLanguagePreference: vi.fn().mockResolvedValue(undefined),
  },
}));

import { applyLanguageToggle } from '@/lib/persist-language';
import { apiClient } from '@/lib/api-client';

const updateSpy = apiClient.updateLanguagePreference as ReturnType<typeof vi.fn>;

beforeEach(() => {
  updateSpy.mockReset();
  updateSpy.mockResolvedValue(undefined);
});

describe('applyLanguageToggle', () => {
  it('always calls setLang with the next language', () => {
    const setLang = vi.fn();
    applyLanguageToggle('kr', setLang, false);
    expect(setLang).toHaveBeenCalledWith('kr');
  });

  it('persists to the account via the API when authenticated', () => {
    const setLang = vi.fn();
    applyLanguageToggle('kr', setLang, true);
    expect(updateSpy).toHaveBeenCalledWith('kr');
  });

  it('does NOT call the API for anonymous users (localStorage only)', () => {
    const setLang = vi.fn();
    applyLanguageToggle('en', setLang, false);
    expect(setLang).toHaveBeenCalledWith('en');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('still toggles locally when the account write rejects (best-effort)', async () => {
    const error = new Error('network');
    updateSpy.mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setLang = vi.fn();

    applyLanguageToggle('kr', setLang, true);

    expect(setLang).toHaveBeenCalledWith('kr');
    // Let the rejected promise settle without bubbling an unhandled rejection.
    await Promise.resolve();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
