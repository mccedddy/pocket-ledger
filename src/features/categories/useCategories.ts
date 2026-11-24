import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  categoriesQueryKey,
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryInput,
} from '../../data/categoryRepository'

export function useCategories(userId: string) {
  return useQuery({
    queryKey: categoriesQueryKey(userId),
    queryFn: () => fetchCategories(userId),
    staleTime: 60_000,
  })
}

export function useCreateCategory(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesQueryKey(userId) }),
  })
}

export function useUpdateCategory(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      updateCategory(userId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesQueryKey(userId) }),
  })
}

export function useDeleteCategory(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoriesQueryKey(userId) }),
  })
}
