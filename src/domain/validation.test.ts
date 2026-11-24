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
})
