import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '../../data/supabase'
import {
  NICKNAME_MAX_LENGTH,
  normalizeEmail,
  normalizeNickname,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordMatch,
} from '../../domain/validation'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { Input } from '../../shared/Input'
import { friendlyAuthError } from './authErrors'
import { useAuth } from './authContext'

type FormErrors = {
  email?: string
  nickname?: string
  password?: string
  confirmPassword?: string
  form?: string
}

export function SignUpPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (session) return <Navigate to="/transactions" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const emailError = validateEmail(email)
    const nicknameError = validateNickname(nickname)
    const passwordError = validatePassword(password)
    const confirmError = validatePasswordMatch(password, confirmPassword)

    if (emailError || nicknameError || passwordError || confirmError) {
      setErrors({
        email: emailError ?? undefined,
        nickname: nicknameError ?? undefined,
        password: passwordError ?? undefined,
        confirmPassword: confirmError ?? undefined,
      })
      return
    }

    setErrors({})
    setMessage(null)
    setIsSubmitting(true)
    try {
      const { data, error } = await getSupabaseClient().auth.signUp({
        email: normalizeEmail(email),
        password,
        options: { data: { nickname: normalizeNickname(nickname) } },
      })

      if (error) {
        setErrors({ form: friendlyAuthError(error, 'Could not create the account. Please try again.') })
        return
      }
      if (data.session) {
        navigate('/transactions', { replace: true })
        return
      }

      setMessage('Account created. Check your email to confirm it, then sign in.')
    } catch (error) {
      setErrors({ form: friendlyAuthError(error, 'Could not create the account. Please try again.') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          Set up your Pocket Ledger profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <Field label="Nickname" htmlFor="nickname" hint={`1–${NICKNAME_MAX_LENGTH} characters.`} error={errors.nickname}>
            <Input
              id="nickname"
              type="text"
              aria-label="Nickname"
              autoComplete="nickname"
              value={nickname}
              invalid={Boolean(errors.nickname)}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="What should we call you?"
            />
          </Field>

          <Field label="Email address" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              aria-label="Email address"
              autoComplete="email"
              value={email}
              invalid={Boolean(errors.email)}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" htmlFor="password" hint="At least 8 characters." error={errors.password}>
            <Input
              id="password"
              type="password"
              aria-label="Password"
              autoComplete="new-password"
              value={password}
              invalid={Boolean(errors.password)}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
            />
          </Field>

          <Field label="Confirm password" htmlFor="confirm-password" error={errors.confirmPassword}>
            <Input
              id="confirm-password"
              type="password"
              aria-label="Confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              invalid={Boolean(errors.confirmPassword)}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
            />
          </Field>

          {errors.form && (
            <p role="alert" className="text-sm text-expense">
              {errors.form}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-income">
              {message}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link className="text-primary underline" to="/sign-in">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
