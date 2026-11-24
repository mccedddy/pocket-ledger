import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignInPage } from './SignInPage'
import { SignUpPage } from './SignUpPage'

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('../../data/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
    },
  }),
}))

vi.mock('./authContext', () => ({
  useAuth: mocks.useAuth,
}))

function renderAuth(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/transactions" element={<p>Transactions screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.signInWithPassword.mockReset()
  mocks.signUp.mockReset()
  mocks.useAuth.mockReset()
  mocks.useAuth.mockReturnValue({ session: null, isLoading: false, signOut: vi.fn() })
  mocks.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null })
  mocks.signUp.mockResolvedValue({ data: { session: null }, error: null })
})

describe('SignInPage', () => {
  it('validates before calling Supabase', async () => {
    renderAuth('/sign-in')

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a password.')).toBeInTheDocument()
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })

  it('signs in with normalized email and navigates on success', async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'test-session' } },
      error: null,
    })
    renderAuth('/sign-in')

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: '  Person@Example.COM ' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Transactions screen')).toBeInTheDocument()
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'password123',
    })
  })
})

describe('SignUpPage', () => {
  it('requires nickname, valid password, and confirmation', async () => {
    renderAuth('/sign-up')

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter a nickname.')).toBeInTheDocument()
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter a password.')).toBeInTheDocument()
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument()
    expect(mocks.signUp).not.toHaveBeenCalled()
  })

  it('passes the nickname as signup metadata and navigates on success', async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: { access_token: 'test-session' } },
      error: null,
    })
    renderAuth('/sign-up')

    fireEvent.change(screen.getByLabelText('Nickname'), {
      target: { value: '  Alex   Morgan  ' },
    })
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'alex@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Transactions screen')).toBeInTheDocument()
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'password123',
      options: { data: { nickname: 'Alex Morgan' } },
    })
  })
})
