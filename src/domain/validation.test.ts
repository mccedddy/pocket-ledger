import { describe, expect, it } from 'vitest'
import {
  NICKNAME_MAX_LENGTH,
  normalizeEmail,
  normalizeNickname,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordMatch,
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
})
