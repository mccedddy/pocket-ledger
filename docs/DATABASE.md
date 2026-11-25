# Pocket Ledger — Database Design

> Last updated: 2026-11-25
> Status: **D-019 unified ledger verified; D-020 balance correction approved; migration `0006_balance_correction.sql` authored and awaiting application.** `0001`–`0005` are applied and verified. `0006` updates seed categories to include `Difference` for both income and expense and backfills existing profiles; no schema columns are added.

## 1. Purpose and governing decisions

This document is the PostgreSQL/Supabase design for the baseline in [PRODUCT.md](./PRODUCT.md) §7. Applied and authored migrations are recorded in §7; schema for later phases remains **proposed**.

Governing items:

- **D-001** — strict minimum, amended by owner to include transfers, editable record time, and the unified ledger.
- **D-002** — Supabase email auth; every user-data row has `user_id`; RLS enforces ownership.
- **D-003** — one currency per user profile; no per-account currency or conversion tables.
- **D-008** — money stored as `numeric(14,2)`; formatting/rounding in `domain/`.
- **D-009** — amended: `occurred_at timestamp` stores local wall-clock date and time; editable, default current local time, no timezone conversion.
- **D-010** — hard delete with confirmation; restrict deletion of accounts/categories with records.
- **D-011** — amended: balance = opening + income − expense − transfer out (including fee) + transfer in; derived, never stored.
- **D-014** — no photos or receipts anywhere; no attachment table or storage design.
- **D-015** — email + password auth with confirmation off; no magic-link/callback tables or columns.
- **D-016** — required nickname at registration, editable in Settings, stored on `profiles` (1–30 characters).
- **D-017** — `PHP` is a supported display currency; `USD` remains the default.
- **D-018** — superseded: transfers originally had a separate table. The fee-as-source-expense balance rule is retained.
- **D-019** — one `transactions` table stores Expense, Income, and Transfer rows; no separate `transfers` table.
- **D-020** — account balance correction either logs a type-specific `Difference` transaction with note `Modified balance`, or adjusts `initial_amount` by the difference so the derived final balance matches the user's entered final balance; the entered final balance is never stored as `initial_amount`. Seed categories gain `Difference` for both income and expense.

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
    └── transactions (id, user_id, type)  -- income | expense | transfer (D-019)
            ├── account_id  → accounts(id, user_id)     -- source / holding account
            ├── to_account_id → accounts(id, user_id)   -- transfer destination only
            └── category_id → categories(id, user_id, type) -- income/expense only
```

Baseline tables: `profiles`, `accounts`, `categories`, `transactions`. There is no `transfers` table after `0005`. Deferred features are **not** represented by tables in the baseline (see §8).

## 3. Baseline tables

### `profiles` (applied)

One row per authenticated user.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade | Same value as the auth user ID. |
| `nickname` | `text` | not null, default `'Member'`, `check (char_length(btrim(nickname)) between 1 and 30)` | Required nickname from registration, editable in Settings (**D-016**); copied from Supabase user metadata by the auth trigger. |
| `currency_code` | `char(3)` | not null | ISO-style currency code for **D-003**. Default `'USD'` is confirmed; supported values include `PHP` (**D-017**). |
| `theme` | `text` | not null, default `'light'`, `check (theme in ('light', 'dark'))` | Manual light/dark preference for **D-005** / F-023. No `'system'` value in the baseline. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit; trigger updates it. |

Phase 1 implementation: `0001_profiles.sql` creates this table, the `profiles_touch_updated_at` trigger, the RLS policies in §5, and the `on_auth_user_created` trigger. `0002_profile_nickname.sql` adds the `nickname` column, backfills existing rows from signup metadata or email, and updates the trigger.

### `accounts` (applied)

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership (**D-002**). |
| `name` | `text` | not null, non-empty after trim | Guide: name and amount are entered when adding an account. |
| `initial_amount` | `numeric(14,2)` | not null, default `0` | Opening balance per **D-011**; type per **D-008**. |
| `sort_order` | `integer` | not null, default `0` | Display ordering; reorder UI is deferred (F-019). |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

`unique (id, user_id)` supports composite foreign keys from `transactions` for both the source (`account_id`) and transfer destination (`to_account_id`). Do not add hidden/excluded-from-totals/card columns yet; those belong to F-019/F-018.

### `categories` (applied)

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership. |
| `name` | `text` | not null, non-empty after trim | Category label. |
| `type` | `text` | not null, check (`income`, `expense`) | Guide separates income and expense categories. |
| `sort_order` | `integer` | not null, default `0` | Display ordering. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

`unique (id, user_id)` and `unique (id, user_id, type)` support composite FK enforcement. Uniqueness of category names is **not specified** by the guide — do not add a unique constraint on `(user_id, type, name)` without confirmation. No `parent_id` column in the baseline; subcategories are F-020.

### `transactions` (applied; unified shape authored in `0005`)

One table holds all three types per **D-019**. `account_id` is the source/holding account for every row; `to_account_id` is populated only for transfers.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Surrogate key. |
| `user_id` | `uuid` | not null, references `auth.users(id)` on delete cascade | Ownership. |
| `type` | `text` | not null, check (`income`, `expense`, `transfer`) | `transfer` added by **D-019**. |
| `occurred_at` | `timestamp` | not null, default `localtimestamp` | Local wall-clock date and time per amended **D-009**; editable in the UI with current local time as default. |
| `account_id` | `uuid` | not null | Source/holding account. Expense decreases it; income increases it; transfer source decreases by `amount + fee`. |
| `to_account_id` | `uuid` | nullable | Transfer destination only; must differ from `account_id`. |
| `category_id` | `uuid` | nullable | Required for income/expense; must be null for transfers. |
| `amount` | `numeric(14,2)` | not null, `check (amount > 0)` | Magnitude only; `type` supplies direction. Storage type: **D-008**. |
| `fee_amount` | `numeric(14,2)` | not null, default `0`, `check (fee_amount >= 0)` | Transfer only; subtracted from the source account. |
| `payee` | `text` | nullable | Optional seller/recipient field for income/expense; null for transfers. |
| `note` | `text` | nullable | Optional note for any type. |
| `created_at` | `timestamptz` | not null, default `now()` | Audit. |
| `updated_at` | `timestamptz` | not null, default `now()` | Audit. |

Composite foreign keys:

- `(account_id, user_id)` → `accounts(id, user_id)` with `on delete restrict`.
- `(to_account_id, user_id)` → `accounts(id, user_id)` with `on delete restrict`; nullable, so skipped for income/expense.
- `(category_id, user_id, type)` → `categories(id, user_id, type)` with `on delete restrict`; nullable, so skipped for transfers and still enforcing type consistency for income/expense.

Type-specific rule enforced by `0005`:

```sql
check (
  (type = 'transfer' and to_account_id is not null
    and category_id is null and fee_amount >= 0
    and account_id <> to_account_id)
  or (type in ('income', 'expense') and to_account_id is null
    and category_id is not null)
)
```

`on delete` behavior is **D-010**: hard deletes with confirmation; `on delete restrict` prevents deleting an account or category still referenced by records.

## 4. Indexes

Applied by `0003` and renamed by `0004`:

```sql
create index transactions_user_occurred_at_idx
  on transactions (user_id, occurred_at desc, created_at desc);
create index transactions_user_account_idx
  on transactions (user_id, account_id);
create index transactions_user_category_idx
  on transactions (user_id, category_id);
create index accounts_user_sort_idx
  on accounts (user_id, sort_order);
create index categories_user_type_sort_idx
  on categories (user_id, type, sort_order);
```

Applied by `0004` for the old transfers table; these disappear with that table in `0005`:

```sql
create index transfers_user_occurred_idx on transfers (user_id, occurred_at desc, created_at desc);
create index transfers_user_from_idx on transfers (user_id, from_account_id);
create index transfers_user_to_idx on transfers (user_id, to_account_id);
```

Authored in `0005`:

```sql
create index transactions_user_to_idx
  on transactions (user_id, to_account_id);
```

## 5. Row-level security

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

The `profiles` policies are applied; an anonymous REST read returned no rows, and two-user verification passed for reads, updates, and inserts. The equivalent `for all` policy is applied to `accounts`, `categories`, and `transactions` — now covering all three transaction types — and two-user verification passed on all three tables. RLS is the security boundary; client-side filtering is not sufficient. Dropping `transfers` in `0005` also removes its policy and trigger.

## 6. Derived balances and money rules

- The guide says an amount is entered when an account is created, but does not define how that amount interacts with later records. **D-011** resolves this: `initial_amount` is the opening balance.
- Displayed balance is derived, not stored. From the single `transactions` table:
  `initial_amount + sum(income to account) − sum(expense from account) − sum(transfer amount + fee where account_id) + sum(transfer amount where to_account_id)`.
  Recompute after row edits/deletes per amended **D-011**.
- Balances are computed in the client data layer using `domain/balance.ts` from cached transactions, and cached by TanStack Query; no SQL view or RPC is used. This follows [ARCHITECTURE.md](./ARCHITECTURE.md) §5.
- Money arithmetic and rounding are centralized in `domain/` helpers; the storage type is **D-008**.
- Currency is display-only per **D-003**; no currency column belongs on accounts or transactions.

## 7. Migrations and seed data

- SQL migrations live in `supabase/migrations/`; TypeScript database types are hand-maintained in `src/data/database.types.ts` and extended alongside each migration.
- `0001_profiles.sql` (applied) creates `profiles`, its triggers and RLS policies. An anonymous REST read returned `200 []`.
- `0002_profile_nickname.sql` (applied) adds `nickname` and updates the profile trigger.
- `0003_core_ledger.sql` (applied and verified live) creates `accounts`, `categories`, and `transactions` with composite foreign keys enforcing ownership and category type, `on delete restrict`, indexes, `for all` RLS policies, `updated_at` triggers, and seed categories.
- `0004_transaction_time_and_transfers.sql` (applied and verified live) renames `transactions.occurred_on` to `occurred_at timestamp` and creates the old `transfers` table.
- `0005_unified_transactions.sql` (**applied and verified**) extends `transactions.type` to include `transfer`, adds `to_account_id` and `fee_amount`, makes `category_id` nullable, adds type-specific checks/composite FKs, copies existing transfer rows into `transactions`, and drops the `transfers` table.
- `0006_balance_correction.sql` (**authored, awaiting application**) replaces `public.seed_categories(uuid)` to include `Difference` for income and expense, and backfills both categories for every existing profile. No table or column changes are made.
- Seed data (**D-006**, amended by **D-020**): new profiles receive exactly ten categories — **expense**: `Food`, `Transport`, `Wants`, `Rent`, `Bills`, `Necessities`, `Difference`; **income**: `Salary`, `Bonus`, `Difference`. No accounts or transactions are seeded.
- Seed rows are inserted by `public.seed_categories(uuid)`, called from the `on_auth_user_created` trigger for new profiles and from a one-time backfill loop for Phase 1 profiles; both paths were verified.
- Project note (**D-007**): the Supabase project is named `pocket-ledger` and uses region `ap-northeast-2`. Vercel is not set up yet; no Vercel-specific schema or config exists.

## 8. Deferred data model outlines (do not create in the baseline)

These are notes for later sessions, not current schema:

| Feature | Likely data needs | Open design points |
| --- | --- | --- |
| F-011 Bookmarks | Saved transaction template with account/category/amount/payee/note and sort order. | Date is set to present when used (guide). |
| F-012 Budgets | Per-category default amount plus month-specific overrides. | Default changes apply from next month; overrides win (guide). |
| F-013 Statistics | Aggregation queries over the unified `transactions` table; no required stored tables. | Period/list/trend semantics from the guide. |
| F-016 Notes | Date-keyed note rows with text/color. | Guide documents colored notes but exact rules need review. |
| F-017 Recurring/installments | Rule tables: frequency, start/end, reflection-day setting, installment count and progress. | Accrual semantics from the guide. |
| F-018 Cards | Card metadata on accounts: billing account, settlement date, payment date. | Cycle/overdue behavior from the guide. |
| F-019 Account display options | `is_hidden`, `excluded_from_totals`, group/order fields. | Guide: hidden accounts still count toward totals. |
| F-020 Subcategories | `parent_id` on categories. | Promotion of subcategory to main category. |

## 9. Open questions and AI handoff

All schema decisions are resolved: D-008–D-011 cover money, amended dates, deletes, and balances; D-006 as amended by D-020 covers seed data; D-014 rules out any photo/attachment design; D-015/D-016 cover the password-auth mode and required nickname; D-017 covers PHP support with USD default; D-019 approves the unified three-type transaction table and supersedes D-018's separate table; D-020 adds correction seed categories without new columns. The remaining Vercel portion of Q-006 is deferred and non-blocking; Supabase name and region are fixed by **D-007**.

When implementing, keep table and column names aligned with this document and update it if the schema changes. Do not create deferred tables "just in case".
