export const NICKNAME_MAX_LENGTH = 30
export const PASSWORD_MIN_LENGTH = 8

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
