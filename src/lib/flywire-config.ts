// Builds the FlywirePayment.initiate() config from the trusted widget-config
// response. Kept separate so the mapping from our snake_case backend shape to
// Flywire's camelCase widget shape (and the pre-fill omit-when-null rule) is
// easy to test without spinning up the page component.
//
// Per the Travel B2B Checkout docs, payer pre-fill keys (`firstName`,
// `lastName`, `email`) live at the root of the config — NOT under a
// `payer_information` wrapper. Latin-only enforcement is intentionally
// skipped for v1; we pass the user's stored name through verbatim.

import type { FlywireInitiateConfig } from '@/types/flywire';
import type { WidgetConfig } from '@/types/payment';

interface BuildFlywireConfigOptions {
  env: string;
  config: WidgetConfig;
}

export function buildFlywireInitiateConfig({
  env,
  config,
}: BuildFlywireConfigOptions): FlywireInitiateConfig {
  // `currency` is intentionally NOT passed: it isn't a documented
  // FlywirePayment.initiate() parameter — Flywire derives currency from
  // the portal (e.g. PARSC = EUR). `requestPayerInfo: true` keeps the
  // widget collecting phone/address even when name/email come pre-filled.
  const initConfig: FlywireInitiateConfig = {
    env,
    recipientCode: config.portal_code,
    amount: parseFloat(config.amount),
    callbackUrl: config.callback_url,
    callbackId: config.callback_id,
    callbackVersion: config.callback_version,
    returnUrl: config.return_url,
    recipientFields: { booking_reference: config.booking_reference },
    requestPayerInfo: true,
  };

  // Only add pre-fill keys when we actually have a value — passing
  // `firstName: undefined` literally would still show up as a present
  // key on the config object and trip Flywire's "payer information is
  // not valid" validation.
  if (config.first_name) {
    initConfig.firstName = config.first_name;
  }
  if (config.last_name) {
    initConfig.lastName = config.last_name;
  }
  if (config.email) {
    initConfig.email = config.email;
  }

  return initConfig;
}
