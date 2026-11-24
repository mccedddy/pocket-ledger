import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionFormPage } from './TransactionFormPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useTransactions: vi.fn(),
  useAccounts: vi.fn(),
  useCategories: vi.fn(),
  useSaveTransaction: vi.fn(),
  useDeleteTransaction: vi.fn(),
  mutateAsync: vi.fn(),
}))

vi.mock('../auth/authContext', () => ({ useAuth: mocks.useAuth }))
vi.mock('../accounts/useAccounts', () => ({ useAccounts: mocks.useAccounts }))
vi.mock('../categories/useCategories', () => ({ useCategories: mocks.useCategories }))
vi.mock('./useTransactions', () => ({
  useTransactions: mocks.useTransactions,
  useSaveTransaction: mocks.useSaveTransaction,
  useDeleteTransaction: mocks.useDeleteTransaction,
}))

const accounts = [
  {
    id: 'account-1',
    user_id: 'user-1',
    name: 'Cash',
    initial_amount: 100,
    sort_order: 0,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
]

const categories = [
  {
    id: 'category-expense',
    user_id: 'user-1',
    name: 'Food',
    type: 'expense' as const,
    sort_order: 1,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
  {
    id: 'category-income',
    user_id: 'user-1',
    name: 'Salary',
    type: 'income' as const,
    sort_order: 1,
    created_at: '2026-11-24T00:00:00.000Z',
    updated_at: '2026-11-24T00:00:00.000Z',
  },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <TransactionFormPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.useAuth.mockReturnValue({ session: { user: { id: 'user-1' } } })
  mocks.useTransactions.mockReturnValue({ isLoading: false, data: [] })
  mocks.useAccounts.mockReturnValue({ isLoading: false, data: accounts })
  mocks.useCategories.mockReturnValue({ isLoading: false, data: categories })
  mocks.mutateAsync.mockReset()
  mocks.useSaveTransaction.mockReturnValue({ mutateAsync: mocks.mutateAsync, isPending: false })
  mocks.useDeleteTransaction.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
})

describe('TransactionFormPage validation', () => {
  it('blocks saving without an amount', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Save record' }))

    expect(await screen.findByText('Enter an amount.')).toBeInTheDocument()
    expect(mocks.mutateAsync).not.toHaveBeenCalled()
  })

  it('offers only categories matching the selected type', () => {
    renderPage()

    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Income' }))

    expect(screen.queryByRole('option', { name: 'Food' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument()
  })

  it('saves a valid record with normalized optional fields', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-24' } })
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '12.50' } })
    fireEvent.change(screen.getByLabelText('Payee'), { target: { value: '  Shop  ' } })
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }))

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: undefined,
        input: {
          type: 'expense',
          occurred_on: '2026-11-24',
          account_id: 'account-1',
          category_id: 'category-expense',
          amount: 12.5,
          payee: 'Shop',
          note: null,
        },
      })
    })
  })
})
