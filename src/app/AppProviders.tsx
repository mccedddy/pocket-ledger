import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { hasSupabaseConfig } from '../data/supabase'
import { AuthProvider } from '../features/auth/AuthProvider'
import { FullPageState } from '../shared/FullPageState'
import { ThemeProvider } from './ThemeProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  if (!hasSupabaseConfig) {
    return (
      <FullPageState>
        <h1 className="mb-2 text-lg font-semibold text-text">Configuration needed</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase URL and anon
          key, then restart the dev server.
        </p>
      </FullPageState>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
