/**
 * Format a money amount (string or number) for display in the given ISO
 * currency. Falls back to `"<CURRENCY> <value>"` when the currency code is
 * unknown or the amount is not numeric.
 */
export function formatCurrency(amount: string | number, currency: string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
