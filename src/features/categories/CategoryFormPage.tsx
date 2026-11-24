import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Category } from '../../data/categoryRepository'
import type { CategoryType } from '../../data/database.types'
import { normalizeEntityName, validateEntityName } from '../../domain/validation'
import { useAuth } from '../auth/authContext'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { Input } from '../../shared/Input'
import { PageHeader } from '../../shared/PageHeader'
import { SegmentedControl } from '../../shared/SegmentedControl'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from './useCategories'

const typeOptions = [
  { value: 'expense' as const, label: 'Expense' },
  { value: 'income' as const, label: 'Income' },
]

export function CategoryFormPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const userId = session!.user.id
  const categories = useCategories(userId)

  if (categories.isLoading) return <p className="text-sm text-muted">Loading category…</p>

  const existing = id ? categories.data?.find((category) => category.id === id) : undefined
  if (id && !existing) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          That category could not be found.
        </p>
        <Link to="/categories" className="mt-4 inline-block text-sm text-primary underline">
          Back to categories
        </Link>
      </Card>
    )
  }

  return <CategoryForm key={existing?.id ?? 'new'} userId={userId} existing={existing} />
}

function CategoryForm({ userId, existing }: { userId: string; existing?: Category }) {
  const navigate = useNavigate()
  const create = useCreateCategory(userId)
  const update = useUpdateCategory(userId)
  const remove = useDeleteCategory(userId)
  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState<CategoryType>(existing?.type ?? 'expense')
  const [nameError, setNameError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setActionError(null)
    const error = validateEntityName(name, 'Category name')
    if (error) {
      setNameError(error)
      return
    }

    setNameError(null)
    const input = { name: normalizeEntityName(name), type }
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, input })
      } else {
        await create.mutateAsync(input)
      }
      navigate('/categories')
    } catch {
      setActionError('Could not save the category. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    setActionError(null)
    if (!window.confirm(`Delete category "${existing.name}"? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(existing.id)
      navigate('/categories')
    } catch {
      setActionError('Could not delete the category. It may still have records.')
    }
  }

  const isPending = create.isPending || update.isPending || remove.isPending

  return (
    <>
      <PageHeader
        title={existing ? 'Edit category' : 'New category'}
        description="Categories are either income or expense."
      />

      <Card>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <Field label="Category name" htmlFor="category-name" error={nameError ?? undefined}>
            <Input
              id="category-name"
              aria-label="Category name"
              value={name}
              invalid={Boolean(nameError)}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(null)
              }}
              placeholder="Groceries, salary…"
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">Type</span>
            <SegmentedControl
              label="Category type"
              value={type}
              options={typeOptions}
              onChange={setType}
              disabled={Boolean(existing) || isPending}
            />
            {existing && (
              <p className="text-xs text-muted">A category's type cannot be changed.</p>
            )}
          </div>

          {actionError && (
            <p role="alert" className="text-sm text-expense">
              {actionError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" isLoading={isPending}>
              {existing ? 'Save changes' : 'Create category'}
            </Button>
            {existing && (
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isPending}
              >
                Delete category
              </Button>
            )}
            <Link to="/categories" className="text-sm text-muted hover:text-text">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  )
}
