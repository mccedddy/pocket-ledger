import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useProfile: vi.fn(),
  useTheme: vi.fn(),
  useNavigate: vi.fn(),
  navigate: vi.fn(),
  signOut: vi.fn(),
  setTheme: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  NavLink: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Outlet: () => <div>screen content</div>,
  useNavigate: mocks.useNavigate,
}))

vi.mock('../features/auth/authContext', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('../features/settings/useProfile', () => ({
  useProfile: mocks.useProfile,
}))

vi.mock('./themeContext', () => ({
  useTheme: mocks.useTheme,
}))

beforeEach(() => {
  mocks.signOut.mockReset()
  mocks.signOut.mockResolvedValue(undefined)
  mocks.navigate.mockReset()
  mocks.useNavigate.mockReturnValue(mocks.navigate)
  mocks.setTheme.mockReset()
  mocks.useAuth.mockReturnValue({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    signOut: mocks.signOut,
  })
  mocks.useProfile.mockReturnValue({ data: { theme: 'light' } })
  mocks.useTheme.mockReturnValue({ setTheme: mocks.setTheme })
})

describe('AppShell sign out', () => {
  it('signs out and redirects to sign-in', async () => {
    render(<AppShell />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1)
    })
    expect(mocks.navigate).toHaveBeenCalledWith('/sign-in', { replace: true })
  })

  it('stays on the page and reports a sign-out failure', async () => {
    mocks.signOut.mockRejectedValue(new Error('network'))

    render(<AppShell />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not sign out.')
    expect(mocks.navigate).not.toHaveBeenCalled()
  })
})
