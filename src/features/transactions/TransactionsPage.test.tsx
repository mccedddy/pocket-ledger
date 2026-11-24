import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionsPage } from './TransactionsPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useTransactions: vi.fn(),
  useAccounts: vi.fn(),
  useCategories: vi.fn(),
  useProfile: vi.fn(),
  useNavigate: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: mocks.useNavigate }
})
vi.mock('../auth/authContext', () => ({ useAuth: mocks.useAuth }))
vi.mock('../settings/useProfile', () => ({ useProfile: mocks.useProfile }))
vi.mock('../accounts/useAccounts', () => ({ useAccounts: mocks.useAccounts }))
vi.mock('../categories/useCategories', () => ({ useCategories: mocks.useCategories }))
vi.mock('./useTransactions', () => ({ useTransactions: mocks.useTransactions }))

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
  {
    id: 'account-2',
    user_id: 'user-1',
    name: 'Bank',
    initial_amount: 200,
    sort_order: 1,
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

const row = (overrides: Record<string, unknown>) => ({
  user_id: 'user-1',
  occurred_at: '2026-11-25T09:15',
  account_id: 'account-1',
  to_account_id: null,
  category_id: 'category-expense',
  amount: 12.5,
  fee_amount: 0,
  payee: null,
  note: null,
  created_at: '2026-11-25T00:00:00.000Z',
  updated_at: '2026-11-25T00:00:00.000Z',
  ...overrides,
})

const transactions = [
  row({ id: 'tx-expense', type: 'expense', payee: 'Coffee Shop', note: 'Morning' }),
  row({
    id: 'tx-income',
    type: 'income',
    occurred_at: '2026-11-25T08:00',
    account_id: 'account-2',
    category_id: 'category-income',
    amount: 100,
    payee: 'Employer',
  }),
  row({
    id: 'tx-transfer',
    type: 'transfer',
    occurred_at: '2026-11-24T18:30',
    to_account_id: 'account-2',
    category_id: null,
    amount: 50,
    fee_amount: 2.5,
    note: 'Savings',
  }),
  row({
    id: 'tx-outside',
    type: 'expense',
    occurred_at: '2026-11-24T07:00',
    amount: 5,
    note: 'Bus fare',
  }),
]

function renderPage() {
  return render(
    <MemoryRouter>
      <TransactionsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.useAuth.mockReturnValue({ session: { user: { id: 'user-1' } } })
  mocks.useProfile.mockReturnValue({
    isLoading: false,
    isError: false,
    data: { currency_code: 'USD' },
  })
  mocks.useTransactions.mockReturnValue({
    isLoading: false,
    isError: false,
    data: transactions,
    refetch: vi.fn(),
  })
  mocks.useAccounts.mockReturnValue({ isLoading: false, isError: false, data: accounts })
  mocks.useCategories.mockReturnValue({ isLoading: false, isError: false, data: categories })
  mocks.navigate.mockClear()
  mocks.useNavigate.mockReturnValue(mocks.navigate)
})

describe('headerless unified TransactionsPage (D-019)', () => {
  it('groups all three types by local day with signed totals and no visible headers', () => {
    renderPage()

    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.getAllByRole('table')[0]).toHaveClass('table-fixed')
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.getAllByText(/2026/)).toHaveLength(2)
    expect(screen.queryByText('Source')).not.toBeInTheDocument()
    expect(screen.queryByText('Destination')).not.toBeInTheDocument()
    expect(screen.queryByText('Income')).not.toBeInTheDocument()
    expect(screen.queryByText('Expense')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'New transfer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete record' })).not.toBeInTheDocument()
    expect(screen.queryAllByText(/\d{1,2}:\d{2}/)).toHaveLength(0)

    const [day25, day24] = screen.getAllByRole('table')
    expect(within(day25).getAllByText('+$100.00')).toHaveLength(2)
    expect(within(day25).getAllByText('−$12.50')).toHaveLength(2)
    expect(within(day24).getByText('+$0.00')).toBeInTheDocument()
    expect(within(day24).getAllByText('−$5.00')).toHaveLength(2)
    expect(within(day24).getByText('−$50.00')).toBeInTheDocument()
  })

  it('shows category, note, account under the note, and signed amount', () => {
    renderPage()

    const editableRows = screen.getAllByLabelText('Edit record')
    expect(editableRows).toHaveLength(4)
    for (const editableRow of editableRows) expect(editableRow).toHaveClass('h-16')
    expect(screen.getByText('Coffee Shop · Cash')).toHaveClass('truncate')

    const expenseRow = screen.getByText('Morning').closest('tr')!
    expect(within(expenseRow).getByText('Food')).toBeInTheDocument()
    expect(within(expenseRow).getByText('Coffee Shop · Cash')).toBeInTheDocument()
    expect(expenseRow.textContent).toMatch(/Morning.*Coffee Shop · Cash/)
    expect(expenseRow).toHaveTextContent('−$12.50')

    const incomeRow = screen.getByText('Employer · Bank').closest('tr')!
    expect(within(incomeRow).getByText('Salary')).toBeInTheDocument()
    expect(incomeRow).toHaveTextContent('+$100.00')

    const outsideRow = screen.getByText('Bus fare').closest('tr')!
    expect(within(outsideRow).getByText('Cash')).toBeInTheDocument()
    expect(screen.queryByText('Outside app')).not.toBeInTheDocument()
  })

  it('shows a transfer arrow account line with the fee under the unchanged amount', () => {
    renderPage()

    const transferRow = screen.getByText('Savings').closest('tr')!
    expect(within(transferRow).getByText('Transfer')).toBeInTheDocument()
    expect(within(transferRow).getByText('Cash → Bank')).toBeInTheDocument()
    expect(within(transferRow).getByText('Fee $2.50')).toBeInTheDocument()
    expect(transferRow).toHaveTextContent('−$50.00')
    expect(transferRow).not.toHaveTextContent('−$52.50')
    expect(within(transferRow).queryByText('—')).not.toBeInTheDocument()
  })

  it('opens a record in edit mode from the row by click or keyboard', () => {
    renderPage()

    const expenseRow = screen.getByText('Morning').closest('tr')!
    expect(expenseRow).toHaveAttribute('tabindex', '0')
    expect(expenseRow).toHaveAttribute('aria-label', 'Edit record')

    fireEvent.click(expenseRow)
    expect(mocks.navigate).toHaveBeenCalledWith('/transactions/tx-expense/edit')
    expect(mocks.navigate).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(expenseRow, { key: 'Enter' })
    expect(mocks.navigate).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(expenseRow, { key: ' ' })
    expect(mocks.navigate).toHaveBeenCalledTimes(3)

    const transferRow = screen.getByText('Savings').closest('tr')!
    fireEvent.click(transferRow)
    expect(mocks.navigate).toHaveBeenCalledWith('/transactions/tx-transfer/edit')
  })
})
