import { describe, expect, it } from 'vitest'
import { calculateBalance } from './balance'

describe('derived balance rule (D-011)', () => {
  it('uses the opening balance plus income minus expenses', () => {
    expect(
      calculateBalance(100, [
        { type: 'income', amount: 50.25 },
        { type: 'expense', amount: 20.1 },
        { type: 'expense', amount: 0.15 },
      ]),
    ).toBe(130)
  })

  it('returns the opening balance with no records and allows negative balances', () => {
    expect(calculateBalance(250, [])).toBe(250)
    expect(calculateBalance(10, [{ type: 'expense', amount: 40 }])).toBe(-30)
  })
})
