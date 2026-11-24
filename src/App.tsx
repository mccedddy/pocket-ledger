import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { RequireAuth } from './app/RequireAuth'
import { RouteError } from './app/RouteError'
import { AccountFormPage } from './features/accounts/AccountFormPage'
import { AccountsPage } from './features/accounts/AccountsPage'
import { SignInPage } from './features/auth/SignInPage'
import { SignUpPage } from './features/auth/SignUpPage'
import { CategoryFormPage } from './features/categories/CategoryFormPage'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TransactionFormPage } from './features/transactions/TransactionFormPage'
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
            <Route path="/transactions/new" element={<TransactionFormPage />} />
            <Route path="/transactions/:id/edit" element={<TransactionFormPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/new" element={<AccountFormPage />} />
            <Route path="/accounts/:id/edit" element={<AccountFormPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/new" element={<CategoryFormPage />} />
            <Route path="/categories/:id/edit" element={<CategoryFormPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/transactions" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
