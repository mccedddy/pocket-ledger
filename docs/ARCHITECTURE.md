# Pocket Ledger — Architecture

> Last updated: 2026-11-24
> Status: **Documentation only.** The diagrams and structure below are proposed; no project scaffolding exists yet.

## 1. Purpose and current state

This document defines the intended technical shape of Pocket Ledger so future sessions make consistent choices. The workspace was empty when this documentation was written: there is no `package.json`, no Supabase project configuration, and no deployment.

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

## 3. Proposed system context

```text
Browser / installed PWA
  └── React + TypeScript SPA (built by Vite, served by Vercel)
        ├── UI components and routing
        ├── Domain logic (pure functions: money, dates, balance rules)
        ├── Data access layer (Supabase client, typed queries)
        └── Supabase JS client
              ├── Auth (email sign-in, session)
              └── Postgres via Supabase API (RLS-scoped tables)
```

Notes:

- The baseline has **no custom backend server**. Vercel serves static assets; Supabase provides authentication, data access, and (later, if needed) file storage.
- All authorization relies on Supabase Auth plus PostgreSQL row-level security described in [DATABASE.md](./DATABASE.md). The browser must never receive a `service_role` key.
- Data never came from the reference app; there is no migration path in the baseline (F-021 is deferred).

## 4. Proposed repository structure

```text
src/
  app/                 # app entry, router, shell, auth guard, route-level error boundaries
  features/
    auth/              # sign-in screen and session hooks
    accounts/          # F-002 screens and account-specific hooks
    categories/        # F-003 screens and category-specific hooks
    transactions/      # F-004/F-005 screens, record editor, history list
    settings/          # F-006 currency setting
  domain/              # pure money/date/balance helpers (no React, no Supabase imports)
  data/                # Supabase client factory, typed repositories/queries, DB types
  shared/              # reusable UI primitives and formatting utilities
  test/                # test setup (not yet created)
public/                # manifest, icons, static PWA assets
supabase/migrations/   # SQL migrations (not yet created)
```

This layout is `Proposed`; folder names should be kept stable once Phase 1 begins. Deferred features should get their own `features/<name>/` module when they are approved, not be mixed into baseline modules.

## 5. Layer responsibilities

### UI and routing (`app/`, `features/*`)

- Render the screens listed in [UI.md](./UI.md) §3.
- Own form state, validation presentation, and navigation.
- Never construct authorization rules locally; rely on the auth guard and RLS.

### Domain logic (`domain/`)

- Pure functions only: currency formatting (**D-003**), money arithmetic, date handling (**Q-002**), and balance derivation (**Q-008**).
- No direct database or React dependencies, so these rules can be unit-tested.
- Do not implement transfer, budget, installment, or card-cycle math in the baseline.

### Data access (`data/`)

- Single configured Supabase client per app instance.
- Typed queries scoped to the signed-in user; RLS is the security boundary, not client filtering.
- Generate or maintain TypeScript database types alongside migrations.
- Balance computation may be exposed through a database view/RPC or computed in the data layer; the choice is `Proposed` and must respect **Q-008**.

### Shared UI (`shared/`)

- Reusable form controls, buttons, list/empty/error states, and layout primitives.
- No business rules; styling follows the **D-005** tokens in [UI.md](./UI.md) §6.

### Styling and theming (D-005)

- Tailwind CSS v4 with CSS-first configuration: raw token variables live on `:root` and `html.dark` in `src/styles/theme.css`, are exposed to utilities through `@theme inline`, and the `dark` variant targets a `.dark` class on `<html>`.
- A small theme provider in `app/` reads `profiles.theme`, applies the class before first paint, and exposes the manual light/dark toggle used by F-023. Default is light; no system mode or accent picker.
- Feature code uses semantic utilities (`bg-surface`, `text-muted`, `bg-income`, `bg-expense`) and the `shared/` components defined in [UI.md](./UI.md) §6; no component library in the baseline.
- PWA manifest theme colors remain light; no offline-data behavior is implied by theming.

## 6. Data fetching and state management

- **Q-009 is open**: choose between TanStack Query, SWR, or lightweight custom hooks before Phase 1 implementation.
- `Proposed` default if no preference is expressed: TanStack Query for server data (caching, loading/error state, invalidation after mutations) plus local React state for form inputs.
- Do not add a global store solely for baseline server data without confirming Q-009.
- Mutating a record must refresh affected account balances and the transaction history view; the exact balance rule is **Q-008**.

## 7. Authentication and security

- Supabase email authentication (**D-002**). Sign-in, session refresh, and sign-out live in `features/auth/`.
- Every user-data table has a `user_id` column and RLS policies using `auth.uid()`; see [DATABASE.md](./DATABASE.md).
- Environment variables hold the Supabase URL and anon/public key only. A `service_role` key must never be bundled into the client.
- Route guard: unauthenticated users cannot reach application screens; the app handles expired sessions by returning to sign-in.
- Avoid logging personal financial data or full auth tokens in the browser console.

## 8. Configuration and environments

`Proposed` environment variables:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project API URL | Safe to expose to the browser. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Safe to expose only because RLS enforces access. |
| `VITE_APP_NAME` | Display name in the PWA manifest | Optional convenience, not a requirement. |

Q-006 must be resolved before real values, project region, and environment names are fixed. No production credentials belong in documentation or source control.

## 9. PWA and deployment

- **PWA (D-004):** manifest + icons in `public/`; minimal service-worker registration only if required for installability; no offline data features.
- **Hosting:** Vercel serves the Vite production build. Build command and output directory follow Vite defaults until confirmed.
- **Q-010:** branch strategy, preview deployments, and production promotion are undecided. Do not assume a specific branching model.

## 10. Proposed testing strategy

No test tooling exists yet. When Phase 1 starts:

- **Unit tests** for `domain/` money/date/balance functions.
- **Component tests** for form validation and list empty/error states.
- **End-to-end tests** for the baseline flows: sign in, create account, create category, add income/expense, verify history and balance, edit/delete, change currency.
- Supabase RLS can be verified with SQL-level policy tests using distinct test users.

Test frameworks are `Proposed` choices pending Q-009; do not install tooling during the documentation phase.

## 11. Deferred architecture concerns

These need dedicated design work when their features are approved:

- Transfers (F-008): representation of source/destination accounts and fees without double-counting balances; changes to the transaction type model.
- Budgets/statistics (F-012/F-013): aggregation queries or materialized summaries.
- Recurring/installments (F-017): scheduled generation semantics and accrual rules from the guide.
- Receipt photos (F-015): Supabase Storage buckets, access rules, and Q-005.
- Offline support (F-022): local persistence, sync, and conflict resolution; explicitly outside **D-004**.
- Import/export (F-021): file parsing and the meaning of backup/restore in a hosted, multi-device context.

## 12. Open questions and AI handoff

Open questions relevant here: Q-001 (money type), Q-002 (dates/timezone), Q-006 (projects/environments), Q-008 (balances), Q-009 (state/data fetching), Q-010 (CI/branching).

Before writing application code, read [FEATURES.md](./FEATURES.md) for the baseline boundary and [ROADMAP.md](./ROADMAP.md) for the current phase. Do not introduce deferred architecture (offline sync, file storage, schedulers) into the baseline.
