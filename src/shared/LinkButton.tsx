import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function LinkButton({
  to,
  children,
  variant = 'primary',
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const colors =
    variant === 'primary'
      ? 'bg-primary text-surface hover:bg-primary-strong'
      : 'border border-border bg-surface-raised text-text hover:bg-primary-soft'

  return (
    <Link
      to={to}
      className={`inline-flex min-h-10 items-center justify-center rounded-control px-4 text-sm font-medium transition-colors ${colors}`}
    >
      {children}
    </Link>
  )
}
