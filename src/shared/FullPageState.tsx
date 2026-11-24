import type { ReactNode } from 'react'

export function FullPageState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md text-center text-sm text-muted">{children}</div>
    </div>
  )
}
