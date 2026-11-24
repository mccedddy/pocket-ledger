import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountsPage } from './AccountsPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useProfile: vi.fn(),
  useAccounts: vi.fn(),
  useAccountBalances: vi.fn(),
  useDeleteAccount: vi.fn(),
  refetch: vi.fn(),
}))

vi.mock('../auth/authContext', () => ({ useAuth: mocks.useAuth }))
vi.mock('../settings/useProfile', () => ({ useProfile: mocks.useProfile }))
vi.mock('./useAccounts', () => ({
  useAccounts: mocks.useAccounts,
  useAccountBalances: mocks.useAccountBalances,
  useDeleteAccount: mocks.useDeleteAccount,
}))

const account = {
  id: 'account-1',
  user_id: 'user-1',
  name: 'Cash',
  initial_amount: 100,
  sort_order: 0,
  created_at: '2026-11-24T00:00:00.000Z',
  updated_at: '2026-11-24T00:00:00.000Z',
}

beforeEach(() => {
  mocks.useAuth.mockReturnValue({ session: { user: { id: 'user-1' } } })
  mocks.useProfile.mockReturnValue({
    isLoading: false,
    isError: false,
    data: { id: 'user-1', currency_code: 'USD' },
  })
  mocks.useDeleteAccount.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  mocks.useAccountBalances.mockReturnValue({
    balances: new Map([['account-1', 130]]),
    isLoading: false,
    isError: false,
    refetch: mocks.refetch,
  })
})

describe('AccountsPage', () => {
  it('shows an inviting empty state with no accounts', () => {
    mocks.useAccounts.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: mocks.refetch,
    })

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('No accounts yet.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add your first account' })).toBeInTheDocument()
  })

  it('shows an error state with a retry action', () => {
    mocks.useAccounts.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: mocks.refetch,
    })

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your accounts.')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('displays the derived balance in the profile currency', () => {
    mocks.useAccounts.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [account],
      refetch: mocks.refetch,
    })

    render(
      <MemoryRouter>
        <AccountsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('$130.00')).toBeInTheDocument()
  })
})
