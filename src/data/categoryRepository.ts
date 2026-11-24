import type { CategoryType, Database } from './database.types'
import { getSupabaseClient } from './supabase'

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInput = Pick<Category, 'name' | 'type'>

export const categoriesQueryKey = (userId: string) => ['categories', userId] as const

export async function fetchCategories(userId: string): Promise<Category[]> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createCategory(userId: string, input: CategoryInput): Promise<Category> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .insert({ user_id: userId, ...input })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryInput,
): Promise<Category> {
  const { data, error } = await getSupabaseClient()
    .from('categories')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export function categoriesOfType(categories: readonly Category[], type: CategoryType): Category[] {
  return categories.filter((category) => category.type === type)
}
