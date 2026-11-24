import { isValidCalendarDate } from './date'
import { parseAmount } from './money'

export const NICKNAME_MAX_LENGTH = 30
export const PASSWORD_MIN_LENGTH = 8
export const ENTITY_NAME_MAX_LENGTH = 100

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value)
  if (!email) return 'Enter your email address.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

export function normalizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateNickname(value: string): string | null {
  const nickname = normalizeNickname(value)
  if (!nickname) return 'Enter a nickname.'
  if (Array.from(nickname).length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer.`
  }
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Enter a password.'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  return null
}

export function validatePasswordMatch(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Confirm your password.'
  if (password !== confirmation) return 'Passwords do not match.'
  return null
}

export function normalizeEntityName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateEntityName(value: string, label = 'Name'): string | null {
  const name = normalizeEntityName(value)
  if (!name) return `Enter a ${label.toLowerCase()}.`
  if (Array.from(name).length > ENTITY_NAME_MAX_LENGTH) {
    return `${label} must be ${ENTITY_NAME_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** Baseline records require an amount greater than zero; opening balances may be negative. */
export function validateAmount(value: string, allowNegative = false): string | null {
  if (!value.trim()) return 'Enter an amount.'
  const amount = parseAmount(value)
  if (amount === null) return 'Enter a valid amount with up to two decimal places.'
  if (!allowNegative && amount <= 0) return 'Amount must be greater than zero.'
  return null
}

export function validateCalendarDate(value: string): string | null {
  if (!value) return 'Choose a date.'
  if (!isValidCalendarDate(value)) return 'Enter a valid date.'
  return null
}
