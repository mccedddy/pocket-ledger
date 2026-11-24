import { createContext, useContext } from 'react'
import type { ThemeValue } from '../data/database.types'

export const THEME_STORAGE_KEY = 'pocket-ledger-theme'

export type ThemeContextValue = {
  theme: ThemeValue
  setTheme: (theme: ThemeValue) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
