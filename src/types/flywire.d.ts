// Ambient declaration for the Flywire Checkout JS bundle.
//
// Loaded dynamically via <Script src={NEXT_PUBLIC_FLYWIRE_SCRIPT_URL} /> on
// /checkout/flywire. Kept loose enough to not break if Flywire's docs evolve
// (additional config keys are allowed via the index signature).

interface FlywireInitiateConfig {
  env: string;
  recipientCode: string;
  amount: number;
  callbackUrl?: string;
  callbackId?: string;
  callbackVersion?: string;
  returnUrl?: string;
  recipientFields?: Record<string, string>;
  requestPayerInfo?: boolean;
  requestRecipientInfo?: boolean;
  nonce?: string;
  [key: string]: unknown;
}

interface FlywirePaymentHandle {
  render: (containerSelector?: string) => void;
}

interface FlywirePaymentApi {
  initiate: (config: FlywireInitiateConfig) => FlywirePaymentHandle;
}

declare global {
  interface Window {
    FlywirePayment?: FlywirePaymentApi;
  }
}

export {};
