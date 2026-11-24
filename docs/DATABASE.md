# Pocket Ledger — Database Design

> Last updated: 2026-11-24
> Status: **Documentation only.** No Supabase project, migration, table, or seed data has been created.

## 1. Purpose and governing decisions

This document is the proposed PostgreSQL/Supabase design for the baseline in [PRODUCT.md](./PRODUCT.md) §7. Schema SQL here is a **proposal for the first implementation session**, not an existing migration.

Governing items:

- **D-001** — strict minimum: baseline tables only.
- **D-002** — Supabase email auth; every user-data row has `user_id`; RLS enforces ownership.
- **D-003** — one currency per user profile; no per-account currency or conversion tables.
- **Q-001** — money storage type unresolved; `numeric(14,2)` is the working proposal.
- **Q-002** — timezone/date-boundary semantics unresolved; `date` is the working proposal for transaction dates.
- **Q-003** — empty vs seeded accounts/categories unresolved.
- **Q-007** — hard vs soft delete unresolved.
- **Q-008** — meaning of an account's initial amount and balance derivation unresolved.

## 2. Proposed entity relationships

```text
auth.users (Supabase Auth)
    │ 1:1
    ▼
profiles (currency setting)

auth.users
    │ 1:N
    ├── accounts (id, user_id)
    ├── categories (id, user_id, type)
    └── transactions (id, user_id, type)
            ├── account_id  → accounts(id, user_id)
            └── category_id → categories(id, user_id, type)
```

Baseline tables: `profiles`, `accounts`, `categories`, `transactions`. Deferred features are **not** represented by tables in the baseline (see §8).

## 3. Baseline tables (proposed)

### `profiles`

One row per authenticated user.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade | Same value as the auth user ID. |
| `currency_code` | `char(3)` | not null | ISO-style currency code for **D-003**. Default `'USD'` is `Proposed`, not confirmed. |
| `theme` | `text` | not null, default `'light'`, `check (theme in ('light', 'dark'))` | Manual light/dark preference for **D-005** / F-023. No `'system'` value in the baseline. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit; trigger or app-managed update is `Proposed`. |

A trigger on `auth.users` insert to create the profile row is `Proposed` (Q-006 may affect implementation details).

### `accounts`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership (**D-002**). |
| `name` | `text` | not null, non-empty after trim | Guide: name and amount are entered when adding an account. |
| `initial_amount` | `numeric(14,2)` | not null, default `0` | Working proposal for Q-001/Q-008. Semantics must be confirmed. |
| `sort_order` | `integer` | not null, default `0` | Display ordering; reorder UI is deferred (F-019). |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

Add `unique (id, user_id)` to support composite foreign keys from `transactions`. Do not add hidden/excluded-from-totals/card columns yet; those belong to F-019/F-018.

### `categories`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership. |
| `name` | `text` | not null, non-empty after trim | Category label. |
| `type` | `text` | not null, check (`income`, `expense`) | Guide separates income and expense categories. |
| `sort_order` | `integer` | not null, default `0` | Display ordering. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

Add `unique (id, user_id)` and `unique (id, user_id, type)` for composite FK support. Uniqueness of category names is **not specified** by the guide — do not add a unique constraint on `(user_id, type, name)` without confirmation. No `parent_id` column in the baseline; subcategories are F-020.

### `transactions`

The baseline stores only income and expense records. Transfers (F-008), installs, bookmarks, and notes are deferred.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership. |
| `type` | `text` | not null, check (`income`, `expense`) | No `transfer` value in the baseline. |
| `occurred_on` | `date` | not null | Working proposal for Q-002; no time-of-day in the baseline. |
| `account_id` | `uuid` | not null | Required by the guide. |
| `category_id` | `uuid` | not null | Required by the guide. |
| `amount` | `numeric(14,2)` | not null; `check (amount > 0)` is `Proposed` | Magnitude only; `type` supplies direction. The guide only says amount is mandatory. Storage type: Q-001. |
| `payee` | `text` | nullable | Optional seller/recipient field from the guide. |
| `note` | `text` | nullable | Optional note from the guide. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

Composite foreign keys (proposed):

- `(account_id, user_id)` → `accounts(id, user_id)`.
- `(category_id, user_id, type)` → `categories(id, user_id, type)` — this enforces that an income record uses an income category and an expense record uses an expense category at the database level.

`on delete` behavior is **Q-007**; do not silently cascade deletes of transactions when an account or category is deleted.

## 4. Indexes (proposed)

```sql
create index transactions_user_occurred_idx
  on transactions (user_id, occurred_on desc, created_at desc);
create index transactions_user_account_idx
  on transactions (user_id, account_id);
create index transactions_user_category_idx
  on transactions (user_id, category_id);
create index accounts_user_sort_idx
  on accounts (user_id, sort_order);
create index categories_user_type_sort_idx
  on categories (user_id, type, sort_order);
```

These support the baseline history list (F-005) and category/account pickers. Add indexes for deferred features only when those features are approved.

## 5. Row-level security (proposed)

Enable RLS on `profiles`, `accounts`, `categories`, and `transactions`. No privileged role access from the client.

```sql
-- profiles
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());
create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- accounts, categories, transactions (repeat per table)
create policy "accounts_all_own" on accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Apply the equivalent `for all` policy to `categories` and `transactions`. RLS is the security boundary; client-side filtering is not sufficient. Verify policies with two distinct test users before Phase 2 completion.

## 6. Derived balances and money rules

- The guide says an amount is entered when an account is created, but does not define how that amount interacts with later transactions. Therefore `initial_amount` semantics are **Q-008**.
- `Proposed`: an account's displayed balance is derived, not stored, along the lines of `initial_amount + sum(income) - sum(expense)` for that account. Do not implement this rule as if it were confirmed; ask Q-008 first.
- Whether balances are computed in SQL (view/RPC) or in the data layer is `Proposed` and follows [ARCHITECTURE.md](./ARCHITECTURE.md) §5.
- Money arithmetic and rounding must be centralized in `domain/` helpers; the storage type depends on Q-001.
- Currency is display-only per **D-003**; no currency column belongs on accounts or transactions.

## 7. Migrations and seed data

- `Proposed`: SQL migrations live in `supabase/migrations/`; TypeScript database types are generated from the schema and kept in the data layer.
- No migration files exist yet. Phase 1 creates the first migration only after Q-001/Q-002/Q-007/Q-008 are answered.
- Seed data: none until **Q-003** is answered. Do not assume a default set of accounts or categories.

## 8. Deferred data model outlines (do not create in the baseline)

These are notes for later sessions, not current schema:

| Feature | Likely data needs | Open design points |
| --- | --- | --- |
| F-008 Transfers | Source/destination accounts, amount, optional fee; either a new transaction type with `to_account_id`/`fee_amount` or a separate table. | Avoid double-counting balances; guide says fees are expenses and transfers do not appear in the transaction list. |
| F-011 Bookmarks | Saved transaction template with account/category/amount/payee/note and sort order. | Date is set to present when used (guide). |
| F-012 Budgets | Per-category default amount plus month-specific overrides. | Default changes apply from next month; overrides win (guide). |
| F-013 Statistics | Aggregation queries over transactions; no required stored tables. | Period/list/trend semantics from the guide. |
| F-015 Photos | `attachments` table with transaction reference and storage path; Supabase Storage bucket. | Q-005. |
| F-016 Notes | Date-keyed note rows with text/color. | Guide documents colored notes but exact rules need review. |
| F-017 Recurring/installments | Rule tables: frequency, start/end, reflection-day setting, installment count and progress. | Accrual semantics from the guide. |
| F-018 Cards | Card metadata on accounts: billing account, settlement date, payment date. | Cycle/overdue behavior from the guide. |
| F-019 Account display options | `is_hidden`, `excluded_from_totals`, group/order fields. | Guide: hidden accounts still count toward totals. |
| F-020 Subcategories | `parent_id` on categories. | Promotion of subcategory to main category. |

## 9. Open questions and AI handoff

Resolve Q-001, Q-002, Q-007, and Q-008 before writing the first migration. Q-003 affects seed files only. Q-006 affects project/environment wiring.

When implementing, keep table and column names aligned with this document and update it if the schema changes. Do not create deferred tables "just in case".
