import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/authContext'
import { useProfile } from '../features/settings/useProfile'
import { Button } from '../shared/Button'
import { useTheme } from './themeContext'

const appName = import.meta.env.VITE_APP_NAME?.trim() || 'Pocket Ledger'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-control px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-primary-soft text-primary'
      : 'text-muted hover:bg-surface-subtle hover:text-text'
  }`

export function AppShell() {
  const { session, signOut } = useAuth()
  const { data: profile } = useProfile(session!.user)
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) setTheme(profile.theme)
  }, [profile, setTheme])

  const handleSignOut = async () => {
    setSignOutError(null)
    try {
      await signOut()
      navigate('/sign-in', { replace: true })
    } catch {
      setSignOutError('Could not sign out. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface-raised">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold text-text">{appName}</span>
            <nav aria-label="Primary" className="flex items-center gap-1">
              <NavLink to="/transactions" className={navClass}>
                Transactions
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                Settings
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{session?.user.email}</span>
            <Button variant="ghost" onClick={handleSignOut} className="min-h-8 px-2 text-xs">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {signOutError && (
        <p role="alert" className="mx-auto mt-3 max-w-5xl px-4 text-sm text-expense sm:px-6">
          {signOutError}
        </p>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
