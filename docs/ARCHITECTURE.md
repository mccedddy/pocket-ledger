# Pocket Ledger — Architecture

> Last updated: 2026-11-25
> Status: **D-019 verified; D-020 approved; migration `0006_balance_correction.sql` authored and awaiting application.** One `transactions` table holds Expense, Income, and Transfer rows; the record screen switches fields by type and the history is headerless, grouped by local day with signed totals. Account balance correction can log a `Difference` record or adjust the opening balance explicitly.

## 1. Purpose and current state

This document defines the intended technical shape of Pocket Ledger so future sessions make consistent choices. Phase 1 scaffolding now exists locally (`package.json`, source folders, profile migrations, PWA assets); the Supabase project is configured locally and the first migration is applied, but no Vercel project or deployment exists yet.

All statements are marked using the labels in [PRODUCT.md](./PRODUCT.md) §2.

## 2. Fixed constraints and decisions

| Item | Value | Basis |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Given constraint |
| Backend/database | Supabase + PostgreSQL | Given constraint |
| Hosting | Vercel | Given constraint |
| Platform | Responsive web app, PWA support | Given constraint |
| Auth | Supabase email authentication; per-user ownership via `user_id` and RLS | **D-002** |
| Currency | Single configurable currency, display-only | **D-003** |
| PWA | Installable only; no offline data or sync | **D-004** |
| Feature scope | Strict minimum baseline (now includes theme setting) | **D-001** |
| Design system | Rose-accented tokens, Inter, Tailwind CSS v4, manual light/dark with light default | **D-005** |
| Money | `numeric(14,2)`; formatting/rounding in `domain/` | **D-008** |
| Dates | Editable local date/time (`occurred_at timestamp`), no timezone conversion | amended **D-009** |
| Deletes/balances | Hard delete with restrict; derived balance including transfers and fees | **D-010**, amended **D-011**, **D-019** |
| State | TanStack Query for server data, local React state for forms | **D-012** |
| CI | PR previews plus `main` auto-deploy when Vercel exists | **D-013** |
| Photos | No photo/receipt attachments anywhere in the product | **D-014** |
| Auth mode | Email + password; confirmation off; no magic links or callback route | **D-015** |
| Nickname | Required 1–30 characters at registration, editable in Settings, stored on `profiles` | **D-016** |
| Currency list | `PHP` supported; `USD` remains default; no conversion | **D-017** |
| Ledger | One table for Expense, Income, and Transfer; no separate transfer module or route | **D-019** |
| Balance correction | Account editor compares an entered final balance with the derived balance; logs a `Difference` income/expense or adjusts opening balance by the difference | **D-020** |

## 3. Proposed system context

```text
Browser / installed PWA
  └── React + TypeScript SPA (built by Vite, served by Vercel)
        ├── UI components and routing
        ├── Domain logic (pure functions: money, dates, balance rules)
        ├── Data access layer (Supabase client, typed queries)
        └── Supabase JS client
              ├── Auth (email + password sign-up/sign-in, session)
              └── Postgres via Supabase API (RLS-scoped tables)
```

Notes:

- The baseline has **no custom backend server**. Vercel serves static assets; Supabase provides authentication and data access. No file storage is part of the baseline (**D-014**).
- All authorization relies on Supabase Auth plus PostgreSQL row-level security described in [DATABASE.md](./DATABASE.md). The browser must never receive a `service_role` key.
- Data never came from the reference app; there is no migration path in the baseline (F-021 is deferred).

## 4. Repository structure

```text
src/
  app/                 # AppProviders, AppShell, RequireAuth, RouteError, ThemeProvider
  features/
    auth/              # SignInPage, SignUpPage, AuthProvider, session hook, error helpers
    settings/          # SettingsPage and profile query/mutation hooks
    transactions/      # unified history, record editor, and query hooks (F-004/F-005)
  domain/              # pure helpers; currency.ts and validation.ts implemented in Phase 1
  data/                # Supabase client, hand-maintained DB types, repositories
  shared/              # Button, Field, Input, Select, Card, PageHeader, FullPageState
  test/                # Vitest setup
public/                # icons, favicon, static PWA assets
supabase/migrations/   # 0001_profiles.sql and 0002_profile_nickname.sql applied
scripts/               # icon generation helper (not part of the npm build)
```

Phase 2 added `features/accounts/`, `features/categories/`, the real `features/transactions/` screens, and `supabase/migrations/0003_core_ledger.sql`. D-009/D-018 added editable record time and a temporary `features/transfers/` module with `0004_transaction_time_and_transfers.sql`. D-019 removes that module and routes and folds all behavior into `features/transactions/` with `supabase/migrations/0005_unified_transactions.sql`. Deferred features get their own `features/<name>/` module only when approved.

## 5. Layer responsibilities

### UI and routing (`app/`, `features/*`)

- Render the screens listed in [UI.md](./UI.md) §3.
- Settings owns nickname editing (required, 1–30 chars, **D-016**) and the currency selector, which includes `PHP` while keeping `USD` as default (**D-017**).
- Own form state, validation presentation, and navigation.
- Never construct authorization rules locally; rely on the auth guard and RLS.

### Domain logic (`domain/`)

- Pure functions only: currency formatting (**D-003**), money arithmetic (**D-008**), date handling (**D-009**), and balance derivation (**D-011**).
- No direct database or React dependencies, so these rules can be unit-tested.
- Phase 1 implemented `domain/currency.ts`; Phase 2 added `date.ts`, `money.ts`, and `balance.ts`. `validation.ts` now covers all three transaction types.
- Transfer math belongs in the unified balance/validation helpers, not a feature module. Budget, installment, and card-cycle math remain out of the baseline.

### Data access (`data/`)

- Single configured Supabase client per app instance.
- Typed queries scoped to the signed-in user; RLS is the security boundary, not client filtering.
- Generate or maintain TypeScript database types alongside migrations.
- Balance computation is client-side in `domain/balance.ts` from cached rows in the single `transactions` query and cached by TanStack Query; no SQL view/RPC is used. This respects **D-011** and remains true after **D-019**.

### Shared UI (`shared/`)

- Reusable form controls, buttons, list/empty/error states, and layout primitives.
- No business rules; styling follows the **D-005** tokens in [UI.md](./UI.md) §6.

### Styling and theming (D-005)

- Tailwind CSS v4 with CSS-first configuration: raw token variables live on `:root` and `html.dark` in `src/styles/theme.css`, are exposed to utilities through `@theme inline`, and the `dark` variant targets a `.dark` class on `<html>`.
- A small theme provider in `app/` reads `profiles.theme`, applies the class before first paint, and exposes the manual light/dark toggle used by F-023. Default is light; no system mode or accent picker.
- Feature code uses semantic utilities (`bg-surface`, `text-muted`, `bg-income`, `bg-expense`) and the `shared/` components defined in [UI.md](./UI.md) §6; no component library in the baseline.
- PWA manifest theme colors remain light; no offline-data behavior is implied by theming.

## 6. Data fetching and state management

- **D-012**: TanStack Query for server data (caching, loading/error state, invalidation after mutations) plus local React state for form inputs.
- Do not add a global store solely for baseline server data; the data-fetching choice is settled.
- Mutating any transaction type must refresh account balances and the unified history; the balance rule is amended **D-011**, including transfer fees per **D-019**. All three types share one query cache key and one history table.

## 7. Authentication and security

- Supabase email + password authentication (**D-002**, **D-015**). Sign-up, sign-in, session refresh, and sign-out live in `features/auth/`. Email confirmation is off, so no email is sent; magic links and `/auth/callback` are removed. Nickname validation is a pure domain helper and the value is stored in `profiles.nickname` (**D-016**).
- Every user-data table has a `user_id` column and RLS policies using `auth.uid()`; see [DATABASE.md](./DATABASE.md).
- Environment variables hold the Supabase URL and publishable/anon client key only. A `service_role` key must never be bundled into the client.
- Route guard: unauthenticated users cannot reach application screens; the app handles expired sessions by returning to sign-in.
- Avoid logging personal financial data or full auth tokens in the browser console.

## 8. Configuration and environments

`Proposed` environment variables:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project API URL | Safe to expose to the browser. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable client key (`sb_publishable_...`) | Safe to expose only because RLS enforces access. |
| `VITE_SUPABASE_ANON_KEY` | Legacy anon/public key | Accepted as a fallback when no publishable key is set. |
| `VITE_APP_NAME` | Display name in the app shell | Optional; defaults to "Pocket Ledger". The manifest name is fixed. |

Phase 1 adds `.env.example` with these variables and `vercel.json` with the Vite build command, `dist/` output, and an SPA rewrite. With **D-015** there is no auth redirect URL to allow; in Supabase set Authentication → Providers → Email → Confirm email off so `signUp()` returns a session immediately.

Per **D-007**, the Supabase project exists, is named `pocket-ledger`, and is hosted in region `ap-northeast-2`. The Vercel project does not exist yet, and no Vercel-specific configuration or deployment is part of current work. Q-006 is now limited to Vercel project/environment names and is deferred and non-blocking. No production credentials belong in documentation or source control.

## 9. PWA and deployment

- **PWA (D-004):** `vite-plugin-pwa` generates the manifest and a precache-only service worker for the app shell; icons live in `public/icons/`. There is no runtime user-data cache, background sync, or offline UI.
- **Hosting:** Vercel remains the intended host, but the Vercel project does not exist yet (**D-007**). `vercel.json` records the Vite defaults (build command, `dist/` output, SPA rewrite); actual deployment setup is deferred.
- **D-013:** when Vercel is created, use PR previews plus auto-deploy from `main`. Actual setup remains deferred with the Vercel project.

## 10. Testing strategy

Vitest and Testing Library are installed. Current coverage (48 tests passing):

- **Unit tests** for `domain/currency.ts`, `domain/validation.ts`, `domain/money.ts`, `domain/date.ts`, and `domain/balance.ts`, covering all three transaction types.
- **Component tests** for the shared `Button` (`src/shared/Button.test.tsx`), the sign-in/sign-up forms (`src/features/auth/authPages.test.tsx`), Settings nickname editing (`src/features/settings/SettingsPage.test.tsx`), AppShell sign-out (`src/app/AppShell.test.tsx`), the Accounts list empty/error/balance states (`src/features/accounts/AccountsPage.test.tsx`), account balance correction with logged and opening-balance paths (`src/features/accounts/AccountFormPage.test.tsx`), the unified record form with dynamic fields and mutation arguments for Expense/Income/Transfer (`src/features/transactions/TransactionFormPage.test.tsx`), and the headerless unified history with day totals, row anatomy, transfer arrows, local-day grouping, and row navigation to the editor (`src/features/transactions/TransactionsPage.test.tsx`).

Verification status:

- Automated end-to-end tests for baseline flows are still not added; sign up with nickname, sign in, sign out, create account, create category, add income/expense, verify history and balance, edit/delete, and change currency were instead verified manually/live.
- Supabase RLS verification with distinct test users (completed: anonymous read returned `200 []`; two-user isolation passed read, update, insert, and delete checks on `profiles`, `accounts`, `categories`, `transactions`, and the now-retired `transfers` table).
- Live Phase 2 verification (completed): D-006 seeds for both users, category-type enforcement, derived balance D-011, chronology, restrict deletes, and a production-build browser smoke test of create account → create record → history → balance update.
- Extension verification (completed after `0004`): editable local date/time, transfer CRUD, `transfers` RLS, fee-as-expense balance math, distinct-account/amount/fee constraints, and restrict deletes. 19 live API checks passed.
- D-019 verification (completed): live REST checks confirmed the migrated transfer row in `transactions` with its amount and fee, and that `transfers` is retired (404); the probe data was removed. A production-build browser smoke test confirmed headerless day totals, row anatomy, the transfer arrow, and fee placement. Subsequent UI refinement set transfer Category to `Transfer`, removed record time from the history, replaced table action buttons with clickable/focusable rows that open the editor, and fixed record-row height with truncated note/account text; deletion remains in the editor. Three-type form behavior remains covered by component tests.
- D-020 verification (pending migration): component tests cover both correction paths, including that the opening-balance path adds the difference to the existing `initial_amount` rather than storing the entered final balance; migration `0006_balance_correction.sql` is authored locally and must be applied by the owner before live seed-category checks.

## 11. Deferred architecture concerns

These need dedicated design work when their features are approved:

- Budgets/statistics (F-012/F-013): aggregation queries or materialized summaries.
- Recurring/installments (F-017): scheduled generation semantics and accrual rules from the guide.
- Offline support (F-022): local persistence, sync, and conflict resolution; explicitly outside **D-004**.
- Import/export (F-021): file parsing and the meaning of backup/restore in a hosted, multi-device context.

## 12. Open questions and AI handoff

No open questions block architecture work. Supabase name and region are fixed by **D-007**; only the Vercel portion of Q-006 is deferred until deployment. Money, amended dates, deletes, amended balances, state, CI, and the no-photos rule are settled by D-008–D-014; editable record time is settled by amended **D-009** and the unified three-type ledger by **D-019**, which supersedes **D-018**.

Before writing more application code, read [FEATURES.md](./FEATURES.md) for the baseline boundary and [ROADMAP.md](./ROADMAP.md) for the current phase. Migrations `0001`–`0005` are applied and verified. Supabase email confirmation is off, and sign-in/out plus two-user RLS isolation are verified for both profile and ledger tables. Do not introduce deferred architecture (offline sync, file storage, schedulers) into the baseline.
