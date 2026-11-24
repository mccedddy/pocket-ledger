import { describe, expect, it } from 'vitest'
import { fromCents, parseAmount, sumAmounts, toCents } from './money'

describe('money helpers', () => {
  it('converts between amounts and cents without floating-point drift', () => {
    expect(toCents(12.34)).toBe(1234)
    expect(fromCents(1234)).toBe(12.34)
  })

  it('adds amounts using integer cents', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3)
    expect(sumAmounts([100, -25.5, 0.01])).toBe(74.51)
    expect(sumAmounts([])).toBe(0)
  })

  it('parses only amounts with at most two decimal places', () => {
    expect(parseAmount(' 12.50 ')).toBe(12.5)
    expect(parseAmount('-3')).toBe(-3)
    expect(parseAmount('12.345')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('10000000000000')).toBeNull()
  })
})
