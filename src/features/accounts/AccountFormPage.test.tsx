import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountFormPage } from './AccountFormPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useProfile: vi.fn(),
  useAccounts: vi.fn(),
  useAccountBalances: vi.fn(),
  useCreateAccount: vi.fn(),
  useUpdateAccount: vi.fn(),
  useDeleteAccount: vi.fn(),
  useCategories: vi.fn(),
  useCreateCategory: vi.fn(),
  useSaveTransaction: vi.fn(),
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  deleteMutate: vi.fn(),
  createCategoryMutate: vi.fn(),
  saveTransactionMutate: vi.fn(),
}))

vi.mock('../auth/authContext', () => ({ useAuth: mocks.useAuth }))
vi.mock('../settings/useProfile', () => ({ useProfile: mocks.useProfile }))
vi.mock('./useAccounts', () => ({
  useAccounts: mocks.useAccounts,
  useAccountBalances: mocks.useAccountBalances,
  useCreateAccount: mocks.useCreateAccount,
  useUpdateAccount: mocks.useUpdateAccount,
  useDeleteAccount: mocks.useDeleteAccount,
}))
vi.mock('../categories/useCategories', () => ({
  useCategories: mocks.useCategories,
  useCreateCategory: mocks.useCreateCategory,
}))
vi.mock('../transactions/useTransactions', () => ({
  useSaveTransaction: mocks.useSaveTransaction,
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

const incomeDifference = {
  id: 'category-difference-income',
  user_id: 'user-1',
  name: 'Difference',
  type: 'income' as const,
  sort_order: 3,
  created_at: '2026-11-24T00:00:00.000Z',
  updated_at: '2026-11-24T00:00:00.000Z',
}

const expenseDifference = {
  id: 'category-difference-expense',
  user_id: 'user-1',
  name: 'Difference',
  type: 'expense' as const,
  sort_order: 7,
  created_at: '2026-11-24T00:00:00.000Z',
  updated_at: '2026-11-24T00:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/accounts/account-1/edit']}>
      <Routes>
        <Route path="/accounts/:id/edit" element={<AccountFormPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.useAuth.mockReturnValue({ session: { user: { id: 'user-1' } } })
  mocks.useProfile.mockReturnValue({
    isLoading: false,
    data: { currency_code: 'USD', nickname: 'Tester' },
  })
  mocks.useAccounts.mockReturnValue({ isLoading: false, data: [account] })
  mocks.useAccountBalances.mockReturnValue({
    balances: new Map([['account-1', 130]]),
    isLoading: false,
  })
  mocks.useCreateAccount.mockReturnValue({ mutateAsync: mocks.createMutate, isPending: false })
  mocks.useUpdateAccount.mockReturnValue({ mutateAsync: mocks.updateMutate, isPending: false })
  mocks.useDeleteAccount.mockReturnValue({ mutateAsync: mocks.deleteMutate, isPending: false })
  mocks.useCategories.mockReturnValue({
    isLoading: false,
    data: [incomeDifference, expenseDifference],
  })
  mocks.useCreateCategory.mockReturnValue({
    mutateAsync: mocks.createCategoryMutate,
    isPending: false,
  })
  mocks.useSaveTransaction.mockReturnValue({
    mutateAsync: mocks.saveTransactionMutate,
    isPending: false,
  })
  mocks.createMutate.mockResolvedValue(account)
  mocks.updateMutate.mockResolvedValue(account)
  mocks.deleteMutate.mockResolvedValue(undefined)
  mocks.createCategoryMutate.mockResolvedValue(incomeDifference)
  mocks.saveTransactionMutate.mockResolvedValue({})
})

describe('AccountFormPage balance correction (D-020)', () => {
  it('logs a positive difference as an income Difference record', async () => {
    renderPage()

    expect(screen.getByText('Derived balance: $130.00')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Final balance'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review correction' }))

    expect(screen.getByText('Log $20.00 as income?')).toBeInTheDocument()
    expect(
      screen.getByText('Category Difference · Remarks Modified balance'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Log income' }))

    await waitFor(() =>
      expect(mocks.saveTransactionMutate).toHaveBeenCalledWith({
        input: {
          type: 'income',
          occurred_at: expect.any(String),
          account_id: 'account-1',
          to_account_id: null,
          category_id: 'category-difference-income',
          amount: 20,
          fee_amount: 0,
          payee: null,
          note: 'Modified balance',
        },
      }),
    )
    expect(mocks.updateMutate).not.toHaveBeenCalled()
    expect(
      screen.getByText('Income of $20.00 logged as Difference / Modified balance.'),
    ).toBeInTheDocument()
  })

  it('logs a negative difference as an expense Difference record', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Final balance'), { target: { value: '110' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review correction' }))
    fireEvent.click(screen.getByRole('button', { name: 'Log expense' }))

    await waitFor(() =>
      expect(mocks.saveTransactionMutate).toHaveBeenCalledWith({
        input: expect.objectContaining({
          type: 'expense',
          category_id: 'category-difference-expense',
          amount: 20,
          note: 'Modified balance',
        }),
      }),
    )
  })

  it('adjusts the opening balance by the difference without creating a ledger row', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Final balance'), { target: { value: '110' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review correction' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adjust opening balance instead' }))

    await waitFor(() =>
      expect(mocks.updateMutate).toHaveBeenCalledWith({
        id: 'account-1',
        input: { name: 'Cash', initial_amount: 80 },
      }),
    )
    expect(mocks.saveTransactionMutate).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        'Opening balance adjusted to $80.00; derived balance is now $110.00. No ledger record was created.',
      ),
    ).toBeInTheDocument()
  })

  it('increases the opening balance when the entered final balance is higher', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Final balance'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review correction' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adjust opening balance instead' }))

    await waitFor(() =>
      expect(mocks.updateMutate).toHaveBeenCalledWith({
        id: 'account-1',
        input: { name: 'Cash', initial_amount: 120 },
      }),
    )
    expect(mocks.saveTransactionMutate).not.toHaveBeenCalled()
  })

  it('creates the Difference category on demand if migration seeds are not applied', async () => {
    mocks.useCategories.mockReturnValue({ isLoading: false, data: [] })
    renderPage()

    fireEvent.change(screen.getByLabelText('Final balance'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review correction' }))
    fireEvent.click(screen.getByRole('button', { name: 'Log income' }))

    await waitFor(() =>
      expect(mocks.createCategoryMutate).toHaveBeenCalledWith({
        name: 'Difference',
        type: 'income',
      }),
    )
    expect(mocks.saveTransactionMutate).toHaveBeenCalledWith({
      input: expect.objectContaining({
        category_id: 'category-difference-income',
        note: 'Modified balance',
      }),
    })
  })

  it('does nothing when the actual balance already matches', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Final balance'), { target: { value: '130' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review correction' }))

    expect(screen.getByText('Balance already matches; no correction needed.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
