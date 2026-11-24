import { useState } from 'react'
import { categoriesOfType, type Category } from '../../data/categoryRepository'
import type { LedgerType } from '../../data/database.types'
import { useAuth } from '../auth/authContext'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { LinkButton } from '../../shared/LinkButton'
import { ListRow } from '../../shared/ListRow'
import { PageHeader } from '../../shared/PageHeader'
import { useCategories, useDeleteCategory } from './useCategories'

export function CategoriesPage() {
  const { session } = useAuth()
  const userId = session!.user.id
  const categories = useCategories(userId)
  const remove = useDeleteCategory(userId)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (category: Category) => {
    setActionError(null)
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return
    try {
      await remove.mutateAsync(category.id)
    } catch {
      setActionError('Could not delete the category. It may still have records.')
    }
  }

  if (categories.isLoading) return <p className="text-sm text-muted">Loading categories…</p>

  if (categories.isError || !categories.data) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          Could not load your categories. Please try again.
        </p>
        <Button className="mt-4" onClick={() => void categories.refetch()}>
          Retry
        </Button>
      </Card>
    )
  }

  const sections: { type: LedgerType; title: string }[] = [
    { type: 'expense', title: 'Expense categories' },
    { type: 'income', title: 'Income categories' },
  ]

  return (
    <>
      <PageHeader
        title="Categories"
        description="Classify your records as income or expenses."
        action={<LinkButton to="/categories/new">New category</LinkButton>}
      />

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-expense">
          {actionError}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {sections.map(({ type, title }) => {
          const items = categoriesOfType(categories.data!, type)
          return (
            <section key={type}>
              <h2 className="mb-2 text-base font-semibold text-text">{title}</h2>
              <Card className="p-0">
                {items.length ? (
                  <ul>
                    {items.map((category) => (
                      <ListRow
                        key={category.id}
                        title={category.name}
                        actions={
                          <>
                            <LinkButton
                              to={`/categories/${category.id}/edit`}
                              variant="secondary"
                            >
                              Edit
                            </LinkButton>
                            <Button
                              variant="ghost"
                              aria-label={`Delete ${category.name}`}
                              onClick={() => void handleDelete(category)}
                            >
                              Delete
                            </Button>
                          </>
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="p-6 text-center text-sm text-muted">
                    No {type} categories yet.
                  </p>
                )}
              </Card>
            </section>
          )
        })}
      </div>
    </>
  )
}
