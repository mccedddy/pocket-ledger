/**
 * Money arithmetic for numeric(14,2) values (D-008). Pure functions only:
 * formatting stays in currency.ts and no stored amount is ever mutated.
 */

/** Largest value representable by numeric(14,2). */
export const MAX_AMOUNT = 9_999_999_999_999.99

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function sumAmounts(values: readonly number[]): number {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0))
}

/** Parses a user-entered amount, requiring at most two decimal places. */
export function parseAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || Math.abs(parsed) > MAX_AMOUNT) return null
  return fromCents(toCents(parsed))
}
