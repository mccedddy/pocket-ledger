# Pocket Ledger — Database Design

> Last updated: 2026-11-24
> Status: **Phase 1 and Phase 2 schema applied and verified.** `0001_profiles.sql`, `0002_profile_nickname.sql`, and `0003_core_ledger.sql` are applied. The Phase 2 tables, indexes, RLS policies, eight D-006 seed categories, and backfill for existing profiles were verified with two test users.

## 1. Purpose and governing decisions

This document is the PostgreSQL/Supabase design for the baseline in [PRODUCT.md](./PRODUCT.md) §7. Applied and authored migrations are recorded in §7; schema for later phases remains **proposed**.

Governing items:

- **D-001** — strict minimum: baseline tables only.
- **D-002** — Supabase email auth; every user-data row has `user_id`; RLS enforces ownership.
- **D-003** — one currency per user profile; no per-account currency or conversion tables.
- **D-008** — money stored as `numeric(14,2)`; formatting/rounding in `domain/`.
- **D-009** — calendar `date`, user-local timezone and local calendar boundaries.
- **D-010** — hard delete with confirmation; restrict deletion of accounts/categories with records.
- **D-011** — `initial_amount` is opening balance; balance derived as opening + income − expense.
- **D-014** — no photos or receipts anywhere; no attachment table or storage design.
- **D-015** — email + password auth with confirmation off; no magic-link/callback tables or columns.
- **D-016** — required nickname at registration, editable in Settings, stored on `profiles` (1–30 characters).
- **D-017** — `PHP` is a supported display currency; `USD` remains the default.

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

## 3. Baseline tables (applied)

### `profiles`

One row per authenticated user.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade | Same value as the auth user ID. |
| `nickname` | `text` | not null, default `'Member'`, `check (char_length(btrim(nickname)) between 1 and 30)` | Required nickname from registration, editable in Settings (**D-016**); copied from Supabase user metadata by the auth trigger. |
| `currency_code` | `char(3)` | not null | ISO-style currency code for **D-003**. Default `'USD'` is confirmed; supported values include `PHP` (**D-017**). |
| `theme` | `text` | not null, default `'light'`, `check (theme in ('light', 'dark'))` | Manual light/dark preference for **D-005** / F-023. No `'system'` value in the baseline. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit; trigger or app-managed update is `Proposed`. |

Phase 1 implementation: `0001_profiles.sql` creates this table, the `profiles_touch_updated_at` trigger, the RLS policies in §5, and the `on_auth_user_created` trigger. `0002_profile_nickname.sql` adds the `nickname` column, backfills existing rows from signup metadata or email, and updates the trigger to copy `raw_user_meta_data->>'nickname'`. Deferred Q-006 does not affect this design.

### `accounts`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership (**D-002**). |
| `name` | `text` | not null, non-empty after trim | Guide: name and amount are entered when adding an account. |
| `initial_amount` | `numeric(14,2)` | not null, default `0` | Opening balance per **D-011**; type per **D-008**. |
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
| `occurred_on` | `date` | not null | Calendar day in the user's local timezone per **D-009**; no time-of-day in the baseline. |
| `account_id` | `uuid` | not null | Required by the guide. |
| `category_id` | `uuid` | not null | Required by the guide. |
| `amount` | `numeric(14,2)` | not null; `check (amount > 0)` is `Proposed` | Magnitude only; `type` supplies direction. The guide only says amount is mandatory. Storage type: **D-008**. |
| `payee` | `text` | nullable | Optional seller/recipient field from the guide. |
| `note` | `text` | nullable | Optional note from the guide. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

Composite foreign keys (proposed):

- `(account_id, user_id)` → `accounts(id, user_id)`.
- `(category_id, user_id, type)` → `categories(id, user_id, type)` — this enforces that an income record uses an income category and an expense record uses an expense category at the database level.

`on delete` behavior is **D-010**: hard deletes with confirmation; use `on delete restrict` so an account or category still referenced by records cannot be deleted. Do not silently cascade transactions.

## 4. Indexes (applied)

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

## 5. Row-level security (applied)

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

The `profiles` policies above are applied in Supabase; an anonymous REST read returned no rows as expected, and two-user verification passed for reads, updates, and inserts. The equivalent `for all` policy is applied to `accounts`, `categories`, and `transactions`; two-user verification passed on all three tables (cross-user reads/updates/deletes affect no rows, cross-user inserts return 403). RLS is the security boundary; client-side filtering is not sufficient.

## 6. Derived balances and money rules

- The guide says an amount is entered when an account is created, but does not define how that amount interacts with later transactions. **D-011** resolves this: `initial_amount` is the opening balance.
- An account's displayed balance is derived, not stored: `initial_amount + sum(income) - sum(expense)` for that account. Recompute after record edits/deletes per **D-011**.
- Balances are computed in the client data layer using `domain/balance.ts` and cached by TanStack Query; no SQL view or RPC is used. This follows [ARCHITECTURE.md](./ARCHITECTURE.md) §5.
- Money arithmetic and rounding are centralized in `domain/` helpers; the storage type is **D-008**.
- Currency is display-only per **D-003**; no currency column belongs on accounts or transactions.

## 7. Migrations and seed data

- SQL migrations live in `supabase/migrations/`; TypeScript database types are hand-maintained in `src/data/database.types.ts` and extended alongside each migration.
- The first migration, `supabase/migrations/0001_profiles.sql`, has been applied in Supabase. An anonymous REST read of `profiles` returned `200 []`, confirming the table exists and RLS returns no rows. All schema-blocking questions are resolved (D-008–D-011).
- The second migration, `supabase/migrations/0002_profile_nickname.sql`, adds `nickname` and updates the profile trigger. It has been applied in Supabase, so Settings can read and update `profiles.nickname` immediately.
- The third migration, `supabase/migrations/0003_core_ledger.sql`, creates `accounts`, `categories`, and `transactions` with composite foreign keys enforcing ownership and category type, `on delete restrict`, indexes, `for all` RLS policies, and `updated_at` triggers. It has been applied and verified live.
- Seed data (**D-006**): new profiles receive exactly eight categories — **expense**: `Food`, `Transport`, `Wants`, `Rent`, `Bills`, `Necessities`; **income**: `Salary`, `Bonus`. No accounts are seeded.
- Seed rows are inserted by `public.seed_categories(uuid)`, called from the `on_auth_user_created` trigger for new profiles and from a one-time backfill loop for profiles created in Phase 1. Both paths were verified: each test user has exactly the eight D-006 categories.
- Project note (**D-007**): the Supabase project is named `pocket-ledger` and uses region `ap-northeast-2`. Vercel is not set up yet; no Vercel-specific schema or config exists.

## 8. Deferred data model outlines (do not create in the baseline)

These are notes for later sessions, not current schema:

| Feature | Likely data needs | Open design points |
| --- | --- | --- |
| F-008 Transfers | Source/destination accounts, amount, optional fee; either a new transaction type with `to_account_id`/`fee_amount` or a separate table. | Avoid double-counting balances; guide says fees are expenses and transfers do not appear in the transaction list. |
| F-011 Bookmarks | Saved transaction template with account/category/amount/payee/note and sort order. | Date is set to present when used (guide). |
| F-012 Budgets | Per-category default amount plus month-specific overrides. | Default changes apply from next month; overrides win (guide). |
| F-013 Statistics | Aggregation queries over transactions; no required stored tables. | Period/list/trend semantics from the guide. |
| F-016 Notes | Date-keyed note rows with text/color. | Guide documents colored notes but exact rules need review. |
| F-017 Recurring/installments | Rule tables: frequency, start/end, reflection-day setting, installment count and progress. | Accrual semantics from the guide. |
| F-018 Cards | Card metadata on accounts: billing account, settlement date, payment date. | Cycle/overdue behavior from the guide. |
| F-019 Account display options | `is_hidden`, `excluded_from_totals`, group/order fields. | Guide: hidden accounts still count toward totals. |
| F-020 Subcategories | `parent_id` on categories. | Promotion of subcategory to main category. |

## 9. Open questions and AI handoff

All schema decisions are resolved: D-008–D-011 cover money, dates, deletes, and balances; D-006 covers seed data; D-014 rules out any photo/attachment design; D-015/D-016 cover the password-auth mode and required nickname; D-017 covers PHP support with USD default. The remaining Vercel portion of Q-006 is deferred and non-blocking; Supabase name and region are fixed by **D-007**.

When implementing, keep table and column names aligned with this document and update it if the schema changes. Do not create deferred tables "just in case".
