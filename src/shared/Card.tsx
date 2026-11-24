import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-card border border-border bg-surface-raised p-4 shadow-raised ${className}`}
    >
      {children}
    </section>
  )
}
