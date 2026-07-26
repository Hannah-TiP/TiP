import { describe, it, expect } from 'vitest';
import { buildFlywireInitiateConfig } from '@/lib/flywire-config';
import type { WidgetConfig } from '@/types/payment';

function makeConfig(overrides: Partial<WidgetConfig> = {}): WidgetConfig {
  return {
    portal_code: 'PARSC',
    // EUR — the production Flywire settlement currency (SMA-235) — with
    // real cents so parseFloat has to carry the fractional part.
    amount: '1234.56',
    currency: 'EUR',
    callback_url: 'https://api.example.com/api/v2/webhooks/flywire',
    callback_id: '77',
    callback_version: '2',
    return_url: 'https://www.example.com/quotes/42?paid=1',
    cancel_url: 'https://www.example.com/quotes/42?cancelled=1',
    booking_reference: '77',
    first_name: null,
    last_name: null,
    email: null,
    ...overrides,
  };
}

describe('buildFlywireInitiateConfig', () => {
  it('maps snake_case widget config to the camelCase Flywire shape', () => {
    const result = buildFlywireInitiateConfig({
      env: 'demo',
      config: makeConfig(),
    });

    expect(result).toMatchObject({
      env: 'demo',
      recipientCode: 'PARSC',
      amount: 1234.56,
      callbackUrl: 'https://api.example.com/api/v2/webhooks/flywire',
      callbackId: '77',
      callbackVersion: '2',
      returnUrl: 'https://www.example.com/quotes/42?paid=1',
      recipientFields: { booking_reference: '77' },
      requestPayerInfo: true,
    });
  });

  it('includes firstName / lastName / email when the user row has them', () => {
    const result = buildFlywireInitiateConfig({
      env: 'demo',
      config: makeConfig({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
      }),
    });

    expect(result.firstName).toBe('Ada');
    expect(result.lastName).toBe('Lovelace');
    expect(result.email).toBe('ada@example.com');
  });

  it('omits pre-fill keys entirely when the value is null', () => {
    // Passing `firstName: undefined` literally would still register as a
    // present key on the config object — Flywire bails with "payer
    // information is not valid" in that case. Assert the keys are
    // truly absent, not just falsy.
    const result = buildFlywireInitiateConfig({
      env: 'demo',
      config: makeConfig({ first_name: null, last_name: null, email: null }),
    });

    expect('firstName' in result).toBe(false);
    expect('lastName' in result).toBe(false);
    expect('email' in result).toBe(false);
  });

  it('omits an individual pre-fill key when its value is null but keeps the others', () => {
    const result = buildFlywireInitiateConfig({
      env: 'demo',
      config: makeConfig({
        first_name: 'Ada',
        last_name: null,
        email: 'ada@example.com',
      }),
    });

    expect(result.firstName).toBe('Ada');
    expect('lastName' in result).toBe(false);
    expect(result.email).toBe('ada@example.com');
  });

  it('preserves requestPayerInfo: true even when all pre-fill fields are present', () => {
    const result = buildFlywireInitiateConfig({
      env: 'demo',
      config: makeConfig({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
      }),
    });

    expect(result.requestPayerInfo).toBe(true);
  });

  it('passes Hangul names through verbatim (no Latin-only filtering for v1)', () => {
    // The Flywire docs note a Latin-only constraint; the user has
    // knowingly accepted shipping non-Latin names as-stored for v1.
    const result = buildFlywireInitiateConfig({
      env: 'demo',
      config: makeConfig({ first_name: '민지', last_name: '이' }),
    });

    expect(result.firstName).toBe('민지');
    expect(result.lastName).toBe('이');
  });
});
