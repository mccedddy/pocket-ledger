import { describe, expect, it } from 'vitest'
import {
  NICKNAME_MAX_LENGTH,
  normalizeEmail,
  normalizeNickname,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordMatch,
  normalizeEntityName,
  validateAmount,
  validateCalendarDate,
  validateEntityName,
  validateFeeAmount,
  validateLocalDateTime,
  validateTransactionDraft,
  validateTransferAccounts,
} from './validation'

describe('validation helpers', () => {
  it('normalizes and validates email addresses', () => {
    expect(normalizeEmail('  Person@Example.COM ')).toBe('person@example.com')
    expect(validateEmail('  person@example.com ')).toBeNull()
    expect(validateEmail('')).toBe('Enter your email address.')
    expect(validateEmail('not-an-email')).toBe('Enter a valid email address.')
  })

  it('requires a nickname within the configured length', () => {
    expect(normalizeNickname('  Alex   Morgan  ')).toBe('Alex Morgan')
    expect(validateNickname('  Alex  ')).toBeNull()
    expect(validateNickname('')).toBe('Enter a nickname.')
    expect(validateNickname('a'.repeat(NICKNAME_MAX_LENGTH + 1))).toBe(
      'Nickname must be 30 characters or fewer.',
    )
  })

  it('requires a minimum password length', () => {
    expect(validatePassword('12345678')).toBeNull()
    expect(validatePassword('')).toBe('Enter a password.')
    expect(validatePassword('short')).toBe('Password must be at least 8 characters.')
  })

  it('checks password confirmation', () => {
    expect(validatePasswordMatch('secret123', 'secret123')).toBeNull()
    expect(validatePasswordMatch('secret123', '')).toBe('Confirm your password.')
    expect(validatePasswordMatch('secret123', 'different')).toBe('Passwords do not match.')
  })

  it('requires a non-blank ledger entity name', () => {
    expect(normalizeEntityName('  Food   Court  ')).toBe('Food Court')
    expect(validateEntityName('  Cash  ', 'Account name')).toBeNull()
    expect(validateEntityName('   ')).toBe('Enter a name.')
    expect(validateEntityName('a'.repeat(101), 'Category name')).toBe(
      'Category name must be 100 characters or fewer.',
    )
  })

  it('requires a positive record amount but allows a negative opening balance', () => {
    expect(validateAmount('12.50')).toBeNull()
    expect(validateAmount('')).toBe('Enter an amount.')
    expect(validateAmount('12.345')).toBe('Enter a valid amount with up to two decimal places.')
    expect(validateAmount('0')).toBe('Amount must be greater than zero.')
    expect(validateAmount('-25')).toBe('Amount must be greater than zero.')
    expect(validateAmount('-25', true)).toBeNull()
  })

  it('requires a valid local calendar date', () => {
    expect(validateCalendarDate('2026-11-24')).toBeNull()
    expect(validateCalendarDate('')).toBe('Choose a date.')
    expect(validateCalendarDate('2026-02-30')).toBe('Enter a valid date.')
  })

  it('requires a valid local date and time', () => {
    expect(validateLocalDateTime('2026-11-24T08:30')).toBeNull()
    expect(validateLocalDateTime('')).toBe('Choose a date and time.')
    expect(validateLocalDateTime('2026-02-30T08:30')).toBe('Enter a valid date and time.')
  })

  it('requires two distinct transfer accounts', () => {
    expect(validateTransferAccounts('a', 'b')).toBeNull()
    expect(validateTransferAccounts('', 'b')).toBe('Choose a source account.')
    expect(validateTransferAccounts('a', 'a')).toBe('Choose two different accounts.')
  })

  it('allows a blank or positive fee but rejects negative fees', () => {
    expect(validateFeeAmount('')).toBeNull()
    expect(validateFeeAmount('2.50')).toBeNull()
    expect(validateFeeAmount('-1')).toBe('Fee cannot be negative.')
    expect(validateFeeAmount('1.234')).toBe('Enter a valid fee with up to two decimal places.')
  })
})

describe('three-type transaction draft validation (D-019)', () => {
  const baseDraft = {
    occurredAt: '2026-11-25T09:30',
    accountId: 'account-1',
    toAccountId: 'account-2',
    categoryId: 'category-expense',
    amount: '10.00',
    fee: '',
  }

  it('validates income/expense drafts with an account and category', () => {
    expect(validateTransactionDraft({ ...baseDraft, type: 'expense' })).toEqual({})
    expect(
      validateTransactionDraft({ ...baseDraft, type: 'income', categoryId: '' }).category,
    ).toBe('Choose a category of the selected type.')
  })

  it('validates transfer drafts with distinct accounts and an optional fee', () => {
    expect(
      validateTransactionDraft({
        ...baseDraft,
        type: 'transfer',
        categoryId: '',
        fee: '2.50',
      }),
    ).toEqual({})
    expect(
      validateTransactionDraft({
        ...baseDraft,
        type: 'transfer',
        categoryId: '',
        toAccountId: 'account-1',
      }).accounts,
    ).toBe('Choose two different accounts.')
    expect(
      validateTransactionDraft({
        ...baseDraft,
        type: 'transfer',
        categoryId: '',
        fee: '-1',
      }).fee,
    ).toBe('Fee cannot be negative.')
  })

  it('still requires a valid date and positive amount for every type', () => {
    const errors = validateTransactionDraft({
      ...baseDraft,
      type: 'transfer',
      categoryId: '',
      occurredAt: '',
      amount: '0',
    })
    expect(errors.date).toBe('Choose a date and time.')
    expect(errors.amount).toBe('Amount must be greater than zero.')
  })
})
