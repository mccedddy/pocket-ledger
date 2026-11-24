# Pocket Ledger — Product Definition

> Last updated: 2026-11-24
> Status: **Documentation only.** No application code, schema, or configuration has been created yet.

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
- Transfers, budgets, statistics, bookmarks, search/filters, recurring entries, installments, card billing cycles, notes, receipt photos, and bulk import/export.
- Multi-currency support, currency conversion, or per-account currencies (**D-003**).
- Offline data editing or multi-device sync logic (**D-004**).
- Bank integrations, automated transaction feeds, ads, or in-app purchases.

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

- Supabase email authentication and per-user data ownership (foundation prerequisite, **D-002**).
- Accounts: create, edit, delete, list, with balance display.
- Categories: income/expense categories; create, edit, delete, list.
- Income and expense records: create, edit, delete, and review in a history list.
- Single configurable currency setting (**D-003**).
- Manual theme setting (light/dark, default light) using the Pocket Ledger design system (**D-005**).
- Responsive layout and PWA installability only (**D-004**).

Excluded from the baseline (tracked as deferred features in [FEATURES.md](./FEATURES.md)):

- Transfers, bookmarks, budgets, statistics/reporting, search, filters, multi-period review views (calendar/weekly/monthly/summary), notes, receipt photos, recurring schedules, installments, card billing/settlement, account hiding/groups/exclusions, and import/export.

## 8. Decision register

### Confirmed decisions

| ID | Decision | Detail | Where applied |
| --- | --- | --- | --- |
| D-001 | Baseline scope | Strict minimum: auth, accounts, categories, income/expense records and history, single currency, theme setting, installable PWA. | FEATURES, ROADMAP, UI |
| D-002 | Authentication | Supabase email authentication; every user-data row owned by a `user_id`; RLS enforces ownership. | ARCHITECTURE, DATABASE |
| D-003 | Currency | One configurable currency per user profile; locale formatting; no conversion. | DATABASE, UI, FEATURES |
| D-004 | PWA scope | Installable only (manifest, icons, minimal service-worker handling for installability). No offline data strategy. | ARCHITECTURE, UI, ROADMAP |
| D-005 | Visual design | Pocket Ledger's own design system: provisional rose-accented palette, Inter, Tailwind CSS v4 tokens, manual light/dark theme with light default. Replaces the earlier open question Q-004; not a copy of the reference app's style. | UI, ARCHITECTURE, DATABASE, FEATURES |

### Open questions requiring owner input

| ID | Question | Why it matters | Impact area |
| --- | --- | --- | --- |
| Q-001 | How should money be stored — `numeric(14,2)` or integer minor units? | Determines schema type, validation, and rounding rules. | DATABASE |
| Q-002 | Which timezone and date-boundary rules apply to transaction dates and month cutoffs? | Affects date storage type and every period-based view (even the baseline history ordering). | DATABASE, UI |
| Q-003 | Should the app seed default accounts/categories, or start with empty lists? | Affects onboarding, migrations, and first-run UX. | DATABASE, UI |
| Q-005 | If receipt photos are added later, where should files be stored? | Affects the future storage design; no baseline impact. | ARCHITECTURE, DATABASE |
| Q-006 | What are the Supabase project, Vercel project, region, and environment names? | Needed before real credentials and deploy targets can be configured. | ARCHITECTURE, ROADMAP |
| Q-007 | Should deletions be hard deletes or soft deletes, and how should deleted records affect balances/history? | Determines schema columns and destructive-action behavior. | DATABASE, FEATURES |
| Q-008 | What exactly does the account's initial amount represent, and how are balances derived after edits/deletes? | The guide says an amount is entered when creating an account but does not define the accounting rule. | DATABASE, FEATURES |
| Q-009 | Which frontend data-fetching/state approach should be used (e.g. TanStack Query, SWR, or custom hooks)? | Affects folder structure and dependency choices in Phase 1. | ARCHITECTURE |
| Q-010 | What branch/CI strategy should Vercel use for previews and production? | Affects deployment configuration. | ARCHITECTURE, ROADMAP |

**Resolved:** Q-004 (visual fidelity/branding) is closed by **D-005**. The design is Pocket Ledger's own, not a reproduction of the reference app's style. The palette is provisional ("rose for now") and can be retuned by updating tokens without changing component structure.

## 9. Glossary

| Term | Meaning |
| --- | --- |
| Account | A user-defined place money is held (e.g. cash or bank). Money Manager groups accounts into categories such as Accounts, Cards, Savings; grouping is deferred here. |
| Category | A label used to classify an income or expense record (e.g. groceries, salary). |
| Transaction / record | In the baseline, an income or expense entry. The term "transfer" is reserved for the deferred own-account movement feature. |
| Balance | A derived amount for an account, not a separately maintained ledger total. Exact rule: **Q-008**. |
| Baseline | The first release scope defined by **D-001**. |
| Reference behavior | A behavior explicitly documented in the Money Manager user guide. |

## 10. AI handoff notes

1. Read this file first, then [FEATURES.md](./FEATURES.md) for what is in or out of scope.
2. Never add a feature from the deferred list to an implementation task unless the owner changes **D-001**.
3. Never invent behavior for an `Open (Q-xxx)` item; surface the question instead.
4. Do not create application files while the task is documentation-only.
5. Keep IDs stable when editing these docs; other files cross-reference them.
