/**
 * Currency helpers for D-003 (single display currency) and D-008 (numeric(14,2)).
 * Pure functions only: no React, no Supabase, no formatting side effects.
 */

export const SUPPORTED_CURRENCIES = [
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'EUR',
  'GBP',
  'INR',
  'JPY',
  'KRW',
  'NZD',
  'PHP',
  'SGD',
  'USD',
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
}

export function normalizeCurrencyCode(value: string | null | undefined): CurrencyCode {
  return value && isCurrencyCode(value) ? value : DEFAULT_CURRENCY
}

/**
 * Formats a numeric(14,2) amount for display only. The stored value is never
 * changed by this function, and no conversion is performed.
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
