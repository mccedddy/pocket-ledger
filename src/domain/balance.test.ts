import { describe, expect, it } from 'vitest'
import { balanceEntriesForTransaction, calculateBalance } from './balance'

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

  it('subtracts a transfer and its fee from the source and adds it to the destination', () => {
    const entries = [
      { type: 'transfer_out' as const, amount: 50, fee: 2.5 },
      { type: 'transfer_in' as const, amount: 50 },
    ]
    expect(calculateBalance(200, [entries[0]])).toBe(147.5)
    expect(calculateBalance(100, [entries[1]])).toBe(150)
  })

  it('handles a zero fee and rounds money sums consistently', () => {
    expect(
      calculateBalance(100, [
        { type: 'transfer_out', amount: 30, fee: 0 },
        { type: 'transfer_in', amount: 30 },
        { type: 'expense', amount: 0.1 },
      ]),
    ).toBe(99.9)
  })
})

describe('unified transaction balance entries (D-019)', () => {
  it('maps income and expense rows to one account each', () => {
    expect(
      balanceEntriesForTransaction({
        type: 'income',
        account_id: 'account-1',
        to_account_id: null,
        amount: 25,
        fee_amount: 0,
      }),
    ).toEqual([{ accountId: 'account-1', entry: { type: 'income', amount: 25 } }])

    expect(
      balanceEntriesForTransaction({
        type: 'expense',
        account_id: 'account-1',
        to_account_id: null,
        amount: 12,
        fee_amount: 0,
      }),
    ).toEqual([{ accountId: 'account-1', entry: { type: 'expense', amount: 12 } }])
  })

  it('maps one transfer row to a source and destination entry with its fee', () => {
    const entries = balanceEntriesForTransaction({
      type: 'transfer',
      account_id: 'account-1',
      to_account_id: 'account-2',
      amount: 50,
      fee_amount: 2.5,
    })

    expect(entries).toEqual([
      {
        accountId: 'account-1',
        entry: { type: 'transfer_out', amount: 50, fee: 2.5 },
      },
      { accountId: 'account-2', entry: { type: 'transfer_in', amount: 50 } },
    ])
    expect(calculateBalance(200, [entries[0].entry])).toBe(147.5)
    expect(calculateBalance(100, [entries[1].entry])).toBe(150)
  })

  it('ignores an invalid transfer row with no destination', () => {
    expect(
      balanceEntriesForTransaction({
        type: 'transfer',
        account_id: 'account-1',
        to_account_id: null,
        amount: 50,
        fee_amount: 0,
      }),
    ).toEqual([])
  })
})
