import type { ReactNode } from 'react'
import { AuthContext } from './authContext'
import { useAuthSession } from './useAuthSession'

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthSession()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
