import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeValue } from '../data/database.types'
import { ThemeContext, THEME_STORAGE_KEY } from './themeContext'

function readInitialTheme(): ThemeValue {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeValue>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* Private browsing can block storage; the class is still applied. */
    }
  }, [theme])

  const setTheme = useCallback((next: ThemeValue) => setThemeState(next), [])
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
