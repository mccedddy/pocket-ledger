import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export function Input({ invalid = false, className = '', ...props }: InputProps) {
  return (
    <input
      className={`h-10 w-full rounded-control border bg-surface-raised px-3 text-sm text-text placeholder:text-muted ${
        invalid ? 'border-expense' : 'border-border'
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}
