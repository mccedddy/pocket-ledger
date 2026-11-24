import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  transactionsQueryKey,
  updateTransaction,
  type TransactionInput,
} from '../../data/transactionRepository'

export function useTransactions(userId: string) {
  return useQuery({
    queryKey: transactionsQueryKey(userId),
    queryFn: () => fetchTransactions(userId),
    staleTime: 60_000,
  })
}

export function useSaveTransaction(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TransactionInput }) =>
      id ? updateTransaction(userId, id, input) : createTransaction(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsQueryKey(userId) }),
  })
}

export function useDeleteTransaction(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionsQueryKey(userId) }),
  })
}
