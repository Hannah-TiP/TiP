// Payment-related types for the Flywire checkout integration.
//
// Snake_case fields match the backend response shapes (v2/api/quote.py +
// v2/api/payment_widget_config.py). The /checkout/flywire page maps these
// to Flywire's camelCase widget config when calling FlywirePayment.initiate.

export interface CheckoutSessionResponse {
  checkout_url: string;
  payment_id: number;
}

export interface WidgetConfig {
  portal_code: string;
  amount: string;
  currency: string;
  callback_url: string;
  callback_id: string;
  callback_version: '2';
  return_url: string;
  cancel_url: string;
  booking_reference: string;
  // Payer pre-fill — sourced from the owning user. Any field the user
  // row doesn't have is null and must be omitted from the widget config
  // rather than passed as a literal undefined.
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}
