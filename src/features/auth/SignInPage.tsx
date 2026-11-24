import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '../../data/supabase'
import { normalizeEmail, validateEmail, validatePassword } from '../../domain/validation'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { Input } from '../../shared/Input'
import { friendlyAuthError } from './authErrors'
import { useAuth } from './authContext'

type FormErrors = {
  email?: string
  password?: string
  form?: string
}

export function SignInPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (session) return <Navigate to="/transactions" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError || passwordError) {
      setErrors({
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
      })
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      })

      if (error) {
        setErrors({ form: friendlyAuthError(error, 'Could not sign in. Please try again.') })
        return
      }
      if (!data.session) {
        setErrors({ form: 'Sign-in did not return a session. Please try again.' })
        return
      }

      navigate('/transactions', { replace: true })
    } catch (error) {
      setErrors({ form: friendlyAuthError(error, 'Could not sign in. Please try again.') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
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

          <Field label="Password" htmlFor="password" error={errors.password}>
            <Input
              id="password"
              type="password"
              aria-label="Password"
              autoComplete="current-password"
              value={password}
              invalid={Boolean(errors.password)}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </Field>

          {errors.form && (
            <p role="alert" className="text-sm text-expense">
              {errors.form}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Need an account?{' '}
          <Link className="text-primary underline" to="/sign-up">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
