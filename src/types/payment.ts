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
}
