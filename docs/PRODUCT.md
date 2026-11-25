# Pocket Ledger — Product Definition

> Last updated: 2026-11-24
> Status: **D-019 verified; D-020 approved; migration `0006_balance_correction.sql` authored and awaiting application.** The unified ledger is live; account screens now expose balance correction with an optional logged `Difference` record. The migrated transfer row was verified live, the former `transfers` table is gone, and the production build was smoke-tested in the browser.

## 1. Purpose of this document

This is the top-level product source of truth for Pocket Ledger and for future AI coding sessions. It defines what the product is, which constraints are fixed, which decisions have been made, and which decisions still need input from the project owner.

Related documents:

- [FEATURES.md](./FEATURES.md) — feature inventory, baseline vs deferred, reference behavior.
- [UI.md](./UI.md) — proposed screens and interaction patterns.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — proposed technical design.
- [DATABASE.md](./DATABASE.md) — proposed data model and RLS rules.
- [ROADMAP.md](./ROADMAP.md) — implementation order and phase gates.

## 2. Status labels used across all docs

| Label | Meaning | How AI sessions should treat it |
| --- | --- | --- |
| `Reference` | Behavior explicitly documented in the official Money Manager Android user guide. | Safe to use as a functional requirement; cite the linked article. |
| `Decided (D-xxx)` | A choice made by the project owner. | Treat as a constraint. Do not reopen without being asked. |
| `Proposed` | A recommendation recorded for consistency. | May be changed during design review; do not treat as a confirmed requirement. |
| `Open (Q-xxx)` | Needs input from the project owner. | Ask before implementing; do not guess. |
| `Deferred` | Intentionally outside the current baseline. | Do not implement in the baseline phase. |

## 3. Product summary

Pocket Ledger is a personal finance management **responsive web application** that recreates the essential record-keeping workflow of Money Manager by Realbyte: record income and expenses against accounts and categories, and review the resulting history.

The first release is deliberately minimal (see **D-001**). Money Manager remains the functional reference for behavior that is implemented, but Pocket Ledger is a separate web product, not a byte-for-byte clone.

## 4. Given constraints (not open for reinterpretation)

| Constraint | Value | Source |
| --- | --- | --- |
| Project name | Pocket Ledger | Project owner |
| Reference application | Money Manager by Realbyte (Android) | Project owner |
| Frontend | React + TypeScript + Vite | Project owner |
| Backend and database | Supabase + PostgreSQL | Project owner |
| Hosting | Vercel | Project owner |
| Platform | Responsive web application with PWA support | Project owner |
| Development priority | Recreate essential Money Manager functionality first, then add more | Project owner |
| Repository state | Empty workspace at start of documentation | Observed 2026-11-24 |

These are inputs, not achievements: no scaffolding or deployment exists yet.

## 5. Product goals and non-goals

### Goals

1. Let a signed-in user manage a small set of personal accounts.
2. Let a signed-in user create, edit, delete, and review income and expense records using account, category, date, and amount.
3. Show derived balances and a chronological transaction history for the signed-in user's data.
4. Establish a documentation and design foundation that future AI coding sessions can follow without inventing requirements.

### Non-goals for the baseline

- Full feature parity with Money Manager (see [FEATURES.md](./FEATURES.md) §4 for the deferred list).
- Budgets, statistics, bookmarks, search/filters, recurring entries, installments, card billing cycles, and bulk import/export. Transfers are included in the baseline by **D-019** as a third transaction type.
- Multi-currency support, currency conversion, or per-account currencies (**D-003**).
- Offline data editing or multi-device sync logic (**D-004**).
- Bank integrations, automated transaction feeds, ads, or in-app purchases.
- Photos and receipts in any form are **out of product scope**, not merely deferred (**D-014**). Do not plan storage, UI, or schema for them.

## 6. Relationship to the reference application

The official [Android User Guide](https://help.realbyteapps.com/hc/en-us/categories/360003093993-Android-User-Guide) is the functional reference for documented behavior. When a Pocket Ledger feature corresponds to a guide topic, the docs link to that article and mark the behavior `Reference`.

Important differences to keep in mind:

- The reference app is Android-first and local-first; Pocket Ledger is a web app with Supabase-backed user accounts and row-level data ownership (**D-002**).
- The reference app [does not support synchronization between devices](https://help.realbyteapps.com/hc/en-us/articles/26009445731993-Can-we-sync-between-devices). Pocket Ledger's hosted data model inherently makes data available from multiple browsers; this is a deliberate platform difference, not a documented Money Manager feature.
- Where the guide does not specify a rule (for example, exact delete semantics or balance calculation details), this documentation records an open question instead of inventing one.

### Reference articles used

| Topic | Source |
| --- | --- |
| Home / transaction review views | [Home tab](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab) |
| Income and expense entry | [How to add an income & expense](https://help.realbyteapps.com/hc/en-us/articles/360042701994-How-to-add-an-income-expense) |
| Account registration and management | [How to register/hide/edit/delete accounts](https://help.realbyteapps.com/hc/en-us/articles/360043221593-How-to-register-hide-edit-delete-accounts) |
| Category management | [How to enable sub-category](https://help.realbyteapps.com/hc/en-us/articles/360015963374-How-to-enable-sub-category) |
| Transfers (deferred) | [How to record a transfer](https://help.realbyteapps.com/hc/en-us/articles/360042702534-How-to-record-a-transfer) |
| Budgets (deferred) | [How to set up/modify/delete a budget](https://help.realbyteapps.com/hc/en-us/articles/360042743774-How-to-set-up-modify-delete-a-budget) |
| Statistics (deferred) | [Stats Tab](https://help.realbyteapps.com/hc/en-us/articles/360045310273-Stats-Tab) |
| Bookmarks (deferred) | [How to make a bookmark](https://help.realbyteapps.com/hc/en-us/articles/360042743374-How-to-make-a-bookmark) |
| Repeat schedules and installments (deferred) | [How to set up a repeat schedule & installment](https://help.realbyteapps.com/hc/en-us/articles/360046668993-How-to-set-up-a-repeat-schedule-installment) |
| Search and filters (deferred) | [How to search](https://help.realbyteapps.com/hc/en-us/articles/360046151974-How-to-search) · [How to use filter](https://help.realbyteapps.com/hc/en-us/articles/360043267433-How-to-use-filter) |
| Cards (deferred) | [How to add debit & credit card accounts](https://help.realbyteapps.com/hc/en-us/articles/360046340034-How-to-add-debit-credit-card-accounts) · [How to settle credit card payments](https://help.realbyteapps.com/hc/en-us/articles/360015963554-How-to-settle-credit-card-payments) |
| Backup and import (deferred) | [How to backup and restore data](https://help.realbyteapps.com/hc/en-us/articles/360042747934-How-to-backup-and-restore-data) · [How to import bulk data by Excel file](https://help.realbyteapps.com/hc/en-us/articles/360043223253-How-to-import-bulk-data-by-Excel-file) |

## 7. Baseline scope (decision D-001)

**Decision:** strict minimum first.

Included in the baseline:

- Supabase email/password authentication with a required nickname at registration, plus per-user data ownership (foundation prerequisite, **D-002**, **D-015**, **D-016**).
- Accounts: create, edit, delete, list, with balance display and explicit balance correction (**D-020**).
- Categories: income/expense categories; create, edit, delete, list. New profiles are seeded with seven expense categories and three income categories (**D-006**, amended by **D-020**); no accounts are seeded.
- A single transaction ledger with three types — Expense, Income, and Transfer — created/edited/deleted from one record screen and reviewed in one history table. Every row has an editable local date and time, defaulting to the current local time (**D-009**). Transfers move funds between the user's own accounts; the optional fee is subtracted from the source account (**D-019**).
- Single configurable currency setting; PHP is supported and USD remains the default (**D-003**, **D-017**).
- Manual theme setting (light/dark, default light) using the Pocket Ledger design system (**D-005**).
- Responsive layout and PWA installability only (**D-004**).

Excluded from the baseline (tracked as deferred features in [FEATURES.md](./FEATURES.md)):

- Bookmarks, budgets, statistics/reporting, search, filters, multi-period review views (calendar/weekly/monthly/summary), notes, recurring schedules, installments, card billing/settlement, account hiding/groups/exclusions, and import/export. Photos/receipts are out of scope entirely (**D-014**).

## 8. Decision register

### Confirmed decisions

| ID | Decision | Detail | Where applied |
| --- | --- | --- | --- |
| D-001 | Baseline scope | Strict minimum: auth, accounts, categories, one transaction ledger covering income/expense/transfer, single currency, theme setting, installable PWA. Amended by owner to include transfers, editable record time, then the unified ledger (D-019). | FEATURES, ROADMAP, UI |
| D-002 | Authentication | Supabase email authentication; every user-data row owned by a `user_id`; RLS enforces ownership. | ARCHITECTURE, DATABASE |
| D-003 | Currency | One configurable currency per user profile; locale formatting; no conversion. | DATABASE, UI, FEATURES |
| D-004 | PWA scope | Installable only (manifest, icons, minimal service-worker handling for installability). No offline data strategy. | ARCHITECTURE, UI, ROADMAP |
| D-005 | Visual design | Pocket Ledger's own design system: provisional rose-accented palette, Inter, Tailwind CSS v4 tokens, manual light/dark theme with light default. Replaces the earlier open question Q-004; not a copy of the reference app's style. | UI, ARCHITECTURE, DATABASE, FEATURES |
| D-006 | Seed data | Amended by D-020: new profiles get seven expense categories — Food, Transport, Wants, Rent, Bills, Necessities, Difference — and three income categories — Salary, Bonus, Difference. No accounts are seeded. Closes Q-003 and Q-011. | DATABASE, FEATURES, UI, ROADMAP |
| D-007 | Supabase project | A Supabase project already exists, named `pocket-ledger`, in region `ap-northeast-2`. Vercel project does not exist yet; deployment setup is deferred. | ARCHITECTURE, DATABASE, ROADMAP |
| D-008 | Money storage | `numeric(14,2)` for amounts; formatting and rounding live in `domain/`. Closes Q-001. | DATABASE, ARCHITECTURE |
| D-009 | Dates and timezone | Amended: store `occurred_at timestamp` (local wall-clock date and time, no timezone shift); editable in the UI with current local date/time as default. Local calendar boundaries still apply. Closes Q-002. | DATABASE, UI, ROADMAP |
| D-010 | Deletes | Hard delete with confirmation; restrict deleting an account/category that still has records; no soft delete in the baseline. Closes Q-007. | DATABASE, FEATURES, UI |
| D-011 | Balances | `initial_amount` is the opening balance. Balance = opening + income − expense − transfer out (including fee) + transfer in, recomputed after edits/deletes; never stored. Closes Q-008. | DATABASE, FEATURES, ARCHITECTURE |
| D-012 | State/data fetching | TanStack Query for server data; local React state for forms. Closes Q-009. | ARCHITECTURE, ROADMAP |
| D-013 | CI/branching | When Vercel exists: PR previews plus auto-deploy from `main`. Setup itself is deferred with Vercel. Closes Q-010. | ARCHITECTURE, ROADMAP |
| D-014 | No photos | Pocket Ledger has no photo or receipt attachment feature at all. Closes Q-005; F-015 is out of scope, not deferred. | FEATURES, UI, ARCHITECTURE, DATABASE, ROADMAP |
| D-015 | Auth mode | Supabase email + password. Email confirmation is off for now; magic links are removed. Forgot-password/reset is deferred, not built. | FEATURES, UI, ARCHITECTURE, DATABASE, ROADMAP, README |
| D-016 | Nickname | A nickname of 1–30 characters is required at registration and can be changed in Settings; it cannot be blank. Stored on `profiles`, not shown in the header. | DATABASE, FEATURES, UI, ARCHITECTURE |
| D-017 | Currency list | `PHP` (Philippine peso) is a supported display currency; `USD` remains the default. No currency conversion is added. | FEATURES, UI, ARCHITECTURE, DATABASE, ROADMAP, README |
| D-018 | Transfers *(superseded by D-019)* | Initially approved a separate `transfers` table with optional fee. Retired by the owner's unified-ledger decision; the balance rule (fee as source expense) is retained. | FEATURES, DATABASE, UI, ROADMAP, ARCHITECTURE |
| D-019 | Unified transaction ledger | One `transactions` table holds Expense, Income, and Transfer rows. The source account is `account_id`; transfers also require `to_account_id`, and the two must differ. `category_id` applies only to income/expense; `fee_amount` applies only to transfers and is subtracted from the source. The record screen switches fields by type. The history is grouped by local day with a summary row of signed income/expense totals (no labels) and headerless, fixed-height record rows showing category, note, account, and amount; transfer rows show Category `Transfer`, `source → destination` as the account line, and keep the fee under the amount. Record time is editable on the record screen but is not displayed in the history. Rows open the editor on click or keyboard activation; there are no table action buttons, and deletion stays in the editor. Supersedes D-018. | FEATURES, DATABASE, UI, ROADMAP, ARCHITECTURE, README |
| D-020 | Account balance correction | The account editor offers a correction against the derived balance. The user enters the desired **final** balance; a positive difference can be logged as income and a negative difference as expense. Logged rows use the type-specific `Difference` category, note/remarks `Modified balance`, and leave `initial_amount` untouched. The user may instead adjust `initial_amount` by that difference so the derived final balance matches the entered value, with clear notice that no ledger record is created. Amends D-006 seeds and requires `0006_balance_correction.sql`. | PRODUCT, FEATURES, UI, DATABASE, ROADMAP, ARCHITECTURE, README |

### Open questions and deferred context

| ID | Question | Why it matters | Impact area |
| --- | --- | --- | --- |
| Q-006 *(deferred, non-blocking)* | At deployment time, choose Vercel project and environment names. | Supabase project name and region are already fixed by **D-007** (`pocket-ledger`, `ap-northeast-2`). No action is needed now; Vercel does not exist yet, and nothing in Phase 1 or 2 depends on these details. | ARCHITECTURE, ROADMAP |

**Resolved / partially resolved:**

- Q-004 (visual direction) is closed by **D-005**. The design is Pocket Ledger's own, not a reproduction of the reference app's style. The palette is provisional ("rose for now") and can be retuned by updating tokens without changing component structure.
- Q-003 (seed data) is closed by **D-006** as amended by **D-020**: seven expense categories, three income categories, no accounts.
- Q-011 (income-category seeding) is closed by **D-006** as amended by **D-020**: Salary, Bonus, and Difference.
- Q-006 (project details) is partially closed by **D-007**: Supabase project is `pocket-ledger` in region `ap-northeast-2`. Only Vercel project/environment details remain, deferred because Vercel is not set up yet.
- Q-001, Q-002, Q-007, Q-008, Q-009, and Q-010 are closed by **D-008–D-013**. Q-002 was later amended by **D-009** to store editable local date/time instead of a date only.
- Transfers were originally deferred per **D-001**; **D-018** added them as a separate table, then **D-019** superseded that design with a single three-type transaction ledger. F-008 is folded into F-004/F-005 and remains baseline scope.
- Q-005 is closed by **D-014**: photos/receipts are out of product scope entirely.
- The remaining Vercel portion of Q-006 is deferred and non-blocking; it only matters when deployment is set up. All Phase 1 entry gates are resolved.

## 9. Glossary

| Term | Meaning |
| --- | --- |
| Account | A user-defined place money is held (e.g. cash or bank). Money Manager groups accounts into categories such as Accounts, Cards, Savings; grouping is deferred here. |
| Category | A label used to classify an income or expense record (e.g. groceries, salary). |
| Transaction / record | In the baseline, an income or expense entry. The term "transfer" is reserved for the deferred own-account movement feature. |
| Balance | A derived amount for an account, not a separately maintained ledger total. Exact rule: **D-011**. |
| Baseline | The first release scope defined by **D-001**. |
| Reference behavior | A behavior explicitly documented in the Money Manager user guide. |

## 10. AI handoff notes

1. Read this file first, then [FEATURES.md](./FEATURES.md) for what is in or out of scope.
2. Never add a feature from the deferred list to an implementation task unless the owner changes **D-001**.
3. Never invent behavior for an `Open (Q-xxx)` item; surface the question instead.
4. Do not create application files while the task is documentation-only.
5. Keep IDs stable when editing these docs; other files cross-reference them.
