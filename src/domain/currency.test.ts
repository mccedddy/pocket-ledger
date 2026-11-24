import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  isCurrencyCode,
  normalizeCurrencyCode,
} from './currency'

describe('currency helpers', () => {
  it('defaults to USD for unknown values', () => {
    expect(DEFAULT_CURRENCY).toBe('USD')
    expect(normalizeCurrencyCode(null)).toBe('USD')
    expect(normalizeCurrencyCode('XXX')).toBe('USD')
  })

  it('recognizes only the configured currency codes', () => {
    expect(isCurrencyCode('KRW')).toBe(true)
    expect(isCurrencyCode('PHP')).toBe(true)
    expect(normalizeCurrencyCode('PHP')).toBe('PHP')
    expect(isCurrencyCode('xyz')).toBe(false)
  })

  it('formats without mutating or converting the amount', () => {
    const amount = 1234.5
    const formatted = formatCurrency(amount, 'USD', 'en-US')

    expect(formatted).toBe('$1,234.50')
    expect(amount).toBe(1234.5)
  })
})
