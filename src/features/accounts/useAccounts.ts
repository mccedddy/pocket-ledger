import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  accountsQueryKey,
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
  type AccountInput,
} from '../../data/accountRepository'
import { balanceEntriesForTransaction, calculateBalance, type BalanceEntry } from '../../domain/balance'
import { useTransactions } from '../transactions/useTransactions'

export function useAccounts(userId: string) {
  return useQuery({
    queryKey: accountsQueryKey(userId),
    queryFn: () => fetchAccounts(userId),
    staleTime: 60_000,
  })
}

export function useCreateAccount(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AccountInput) => createAccount(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey(userId) }),
  })
}

export function useUpdateAccount(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountInput }) =>
      updateAccount(userId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey(userId) }),
  })
}

export function useDeleteAccount(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAccount(userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsQueryKey(userId) }),
  })
}

/** D-011 (amended): derive balances from unified transactions; nothing is stored. */
export function useAccountBalances(
  userId: string,
  accounts: readonly { id: string; initial_amount: number }[] | undefined,
) {
  const transactions = useTransactions(userId)

  const balances = new Map<string, number>()
  if (accounts) {
    const byAccount = new Map<string, BalanceEntry[]>()
    for (const transaction of transactions.data ?? []) {
      for (const { accountId, entry } of balanceEntriesForTransaction(transaction)) {
        const entries = byAccount.get(accountId) ?? []
        entries.push(entry)
        byAccount.set(accountId, entries)
      }
    }
    for (const account of accounts) {
      balances.set(
        account.id,
        calculateBalance(account.initial_amount, byAccount.get(account.id) ?? []),
      )
    }
  }

  return {
    balances,
    isLoading: transactions.isLoading,
    isError: transactions.isError,
    refetch: () => {
      void transactions.refetch()
    },
  }
}
