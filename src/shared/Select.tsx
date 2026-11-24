import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

export function Select({ invalid = false, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`h-10 w-full rounded-control border bg-surface-raised px-3 text-sm text-text ${
        invalid ? 'border-expense' : 'border-border'
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}
