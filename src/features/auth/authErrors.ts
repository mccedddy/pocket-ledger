import { PASSWORD_MIN_LENGTH } from '../../domain/validation'

function errorField(error: unknown, key: 'code' | 'message'): string {
  if (error instanceof Error && key === 'message') return error.message
  if (typeof error !== 'object' || error === null || !(key in error)) return ''
  const value = (error as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

export function friendlyAuthError(error: unknown, fallback: string): string {
  const code = errorField(error, 'code')
  const message = errorField(error, 'message')

  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'Incorrect email or password.'
  }

  if (code === 'user_already_exists' || /already registered|already exists/i.test(message)) {
    return 'An account with that email already exists. Sign in instead.'
  }

  if (code === 'weak_password' || /weak password/i.test(message)) {
    return `Password is too weak. Use at least ${PASSWORD_MIN_LENGTH} characters.`
  }

  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) {
    return 'Confirm your email before signing in.'
  }

  if (code === 'over_email_send_rate_limit' || /rate limit/i.test(message)) {
    return "Supabase's email rate limit was reached. Wait a little and try again."
  }

  return message || fallback
}
