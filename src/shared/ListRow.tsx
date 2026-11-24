import type { ReactNode } from 'react'

export function ListRow({
  title,
  subtitle,
  trailing,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  actions?: ReactNode
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-text">{title}</div>
        {subtitle && <div className="truncate text-xs text-muted">{subtitle}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {trailing}
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    </li>
  )
}
