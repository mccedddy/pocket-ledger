import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { RequireAuth } from './app/RequireAuth'
import { RouteError } from './app/RouteError'
import { SignInPage } from './features/auth/SignInPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TransactionsPage } from './features/transactions/TransactionsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} errorElement={<RouteError />} />
        <Route path="/sign-up" element={<SignUpPage />} errorElement={<RouteError />} />
        <Route element={<RequireAuth />} errorElement={<RouteError />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/transactions" replace />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/transactions" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
