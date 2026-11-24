# Pocket Ledger — Architecture

> Last updated: 2026-11-24
> Status: **Phase 1 implemented and sign-in verified.** The structure below is the current baseline; Phase 2 modules remain proposals.

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
| Dates | Calendar `date`, user-local timezone and boundaries | **D-009** |
| Deletes/balances | Hard delete with restrict; derived opening-balance rule | **D-010**, **D-011** |
| State | TanStack Query for server data, local React state for forms | **D-012** |
| CI | PR previews plus `main` auto-deploy when Vercel exists | **D-013** |
| Photos | No photo/receipt attachments anywhere in the product | **D-014** |
| Auth mode | Email + password; confirmation off; no magic links or callback route | **D-015** |
| Nickname | Required 1–30 characters at registration, editable in Settings, stored on `profiles` | **D-016** |
| Currency list | `PHP` supported; `USD` remains default; no conversion | **D-017** |

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
    transactions/      # Phase 1 placeholder only; F-004/F-005 arrive in Phase 2
  domain/              # pure helpers; currency.ts and validation.ts implemented in Phase 1
  data/                # Supabase client, hand-maintained DB types, profile repository
  shared/              # Button, Field, Input, Select, Card, PageHeader, FullPageState
  test/                # Vitest setup
public/                # icons, favicon, static PWA assets
supabase/migrations/   # 0001_profiles.sql and 0002_profile_nickname.sql applied
scripts/               # icon generation helper (not part of the npm build)
```

Phase 2 will add `features/accounts/`, `features/categories/`, and the real `features/transactions/` screens, plus the remaining migrations. Deferred features get their own `features/<name>/` module only when approved.

## 5. Layer responsibilities

### UI and routing (`app/`, `features/*`)

- Render the screens listed in [UI.md](./UI.md) §3.
- Settings owns nickname editing (required, 1–30 chars, **D-016**) and the currency selector, which includes `PHP` while keeping `USD` as default (**D-017**).
- Own form state, validation presentation, and navigation.
- Never construct authorization rules locally; rely on the auth guard and RLS.

### Domain logic (`domain/`)

- Pure functions only: currency formatting (**D-003**), money arithmetic (**D-008**), date handling (**D-009**), and balance derivation (**D-011**).
- No direct database or React dependencies, so these rules can be unit-tested.
- Phase 1 implements `domain/currency.ts` only; date and balance helpers arrive with Phase 2.
- Do not implement transfer, budget, installment, or card-cycle math in the baseline.

### Data access (`data/`)

- Single configured Supabase client per app instance.
- Typed queries scoped to the signed-in user; RLS is the security boundary, not client filtering.
- Generate or maintain TypeScript database types alongside migrations.
- Balance computation may be exposed through a database view/RPC or computed in the data layer; the choice is `Proposed` and must respect **D-011**.

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
- Mutating a record must refresh affected account balances and the transaction history view; the balance rule is **D-011**.

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

Vitest and Testing Library are installed. Current coverage:

- **Unit tests** for `domain/currency.ts` (`src/domain/currency.test.ts`) and `domain/validation.ts` (`src/domain/validation.test.ts`).
- **Component tests** for the shared `Button` (`src/shared/Button.test.tsx`), the sign-in/sign-up forms (`src/features/auth/authPages.test.tsx`), and Settings nickname editing (`src/features/settings/SettingsPage.test.tsx`), including nickname validation and mutation arguments.

Still to add as features land:

- Unit tests for future `domain/` date and balance helpers.
- Component tests for list empty/error states in Phase 2.
- End-to-end tests for baseline flows: sign up with nickname, sign in, sign out, create account, create category, add income/expense, verify history and balance, edit/delete, change currency.
- Supabase RLS verification with distinct test users (anonymous read already confirmed `200 []`; two-user isolation still pending).

## 11. Deferred architecture concerns

These need dedicated design work when their features are approved:

- Transfers (F-008): representation of source/destination accounts and fees without double-counting balances; changes to the transaction type model.
- Budgets/statistics (F-012/F-013): aggregation queries or materialized summaries.
- Recurring/installments (F-017): scheduled generation semantics and accrual rules from the guide.
- Offline support (F-022): local persistence, sync, and conflict resolution; explicitly outside **D-004**.
- Import/export (F-021): file parsing and the meaning of backup/restore in a hosted, multi-device context.

## 12. Open questions and AI handoff

No open questions block architecture work. Supabase name and region are fixed by **D-007**; only the Vercel portion of Q-006 is deferred until deployment. Money, dates, deletes, balances, state, CI, and the no-photos rule are settled by D-008–D-014.

Before writing more application code, read [FEATURES.md](./FEATURES.md) for the baseline boundary and [ROADMAP.md](./ROADMAP.md) for the current phase. Phase 2 should extend the existing folders rather than re-scaffold. Both profile migrations are applied, Supabase email confirmation is off, and sign-in is verified. Next sign up/sign in with a second test user and confirm RLS isolation. Do not introduce deferred architecture (offline sync, file storage, schedulers) into the baseline.
