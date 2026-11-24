# Pocket Ledger — Feature Inventory

> Last updated: 2026-11-24
> Status: **Phase 1 features F-001, F-006, F-007, and F-023 are implemented locally.** Email/password sign-up and sign-in are verified; nickname is editable in Settings, and PHP is supported as a display currency. Phase 2 features remain unimplemented; deferred items are still only requirements.

## 1. Scope

This file classifies every feature discussed so far as baseline (`Decided (D-001)`), deferred, or open. Behavior labeled `Reference` comes from the [official Money Manager Android guide](https://help.realbyteapps.com/hc/en-us/categories/360003093993-Android-User-Guide); the specific article is linked per feature.

Status labels are defined in [PRODUCT.md](./PRODUCT.md) §2. IDs are stable and referenced by the other docs.

## 2. Baseline features (first release)

### F-001 — User authentication and data ownership

- **Status:** `Decided (D-002, D-015, D-016)` — technical prerequisite, no direct reference equivalent.
- **Behavior:** Users sign in with Supabase email authentication. Every user-data row is owned by a `user_id`; row-level security restricts reads and writes to the signed-in user's rows.
- **Phase 1 implementation:** Email + password sign-up (`/sign-up`) and sign-in (`/sign-in`) via Supabase Auth. Email confirmation is off per **D-015**, so no email is sent and there is no callback route. Registration requires a nickname (1–30 characters, **D-016**) passed as Supabase user metadata and copied into `profiles` by the auth trigger. Settings can change that nickname, but cannot set it to blank. Forgot-password/reset is deferred.
- **Acceptance criteria:**
  - Unauthenticated users cannot read or modify user data.
  - A signed-in user cannot read or modify another user's data.
  - A new account stores the supplied nickname in its `profiles` row.
  - The nickname can be changed in Settings, but a blank value is rejected.
- **Dependencies:** Supabase project configuration (**D-007**), auth schema (see [DATABASE.md](./DATABASE.md)).
- **Deferred context:** Supabase name and region are fixed by **D-007** (`pocket-ledger`, `ap-northeast-2`); only the Vercel portion of Q-006 is non-blocking and deferred until deployment. No open questions.

### F-002 — Accounts: create, edit, delete, list

- **Status:** `Reference` + baseline subset of the account-management topic.
- **Reference:** [How to register/hide/edit/delete accounts](https://help.realbyteapps.com/hc/en-us/articles/360043221593-How-to-register-hide-edit-delete-accounts). The guide describes choosing an account group, entering a name and amount, and editing/deleting/reordering/hiding accounts.
- **Baseline behavior:**
  - A user can add an account with a name and an initial amount.
  - A user can edit and delete accounts and view the account list with derived balances.
  - Groups, hiding, reordering, and exclusion from totals belong to F-019 and are **not** in the baseline.
- **Acceptance criteria (reference-derived):**
  - An account cannot be saved without a name and an amount, matching the guide's requirement to insert name and amount.
  - Account changes are visible in the account list.
- **Decisions applied:** D-010 (hard delete with restrict), D-011 (opening balance rule), D-006 (no seeded accounts).
- **Open questions:** None.

### F-003 — Income and expense categories

- **Status:** `Reference` + baseline subset of the category topic.
- **Reference:** [How to enable sub-category](https://help.realbyteapps.com/hc/en-us/articles/360015963374-How-to-enable-sub-category).
- **Baseline behavior:** A user can create, edit, delete, and list categories classified as income or expense. Categories are flat in the baseline; subcategories are deferred to F-020. Per **D-006**, new profiles are seeded with six expense categories — Food, Transport, Wants, Rent, Bills, Necessities — and two income categories — Salary, Bonus. No accounts are seeded.
- **Acceptance criteria:**
  - A category has a name and a type (`income` or `expense`), matching the guide's separate income/expense category management.
  - Income records can only use income categories; expense records can only use expense categories (integrity rule derived from the guide's separate category types).
  - A newly created profile contains exactly the eight seeded categories from D-006 and no seeded accounts.
- **Decisions applied:** D-010 (hard delete; cannot delete a category still used by records).
- **Open questions:** None.

### F-004 — Income and expense records

- **Status:** `Reference` — core of the baseline.
- **Reference:** [How to add an income & expense](https://help.realbyteapps.com/hc/en-us/articles/360042701994-How-to-add-an-income-expense).
- **Reference behavior:**
  - Entry fields are date, account, category, and amount.
  - Account, category, and amount are mandatory.
  - Seller/retailer/store/recipient (payee) and note are optional; the guide says a payee is auto-filled if skipped.
  - The reference app offers a "continue" button for consecutive entries and supports attaching pictures; neither is in Pocket Ledger (photos are out of scope per D-014; continue-entry UX is `Proposed` only and must not be assumed).
  - Saved records can be reviewed in the transaction tab and in the accounts tab.
  - The guide explicitly calls account, category, and amount mandatory; it lists date as an entry field. Requiring a date and requiring `amount > 0` are `Proposed` integrity rules, not explicit guide statements.
- **Baseline behavior:** Create, edit, and delete income/expense records with the required fields above. Optional payee and note are supported. No photos, no recurring metadata, and no transfer type.
- **Acceptance criteria:**
  - Saving without account, category, or amount is rejected (guide-derived); date and amount-positivity validation follow the `Proposed` rules above and D-009 (local calendar date).
  - A saved record appears in the transaction history (F-005).
  - A record's type (`income`/`expense`) matches its category type.
- **Decisions applied:** D-008 (`numeric(14,2)`), D-009 (local calendar date), D-010 (hard delete), D-011 (derived balance).
- **Open questions:** None.

### F-005 — Transaction history

- **Status:** `Reference` (review of records) with a deliberately minimal baseline presentation.
- **Reference:** [Home tab](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab) and the review section of [How to add an income & expense](https://help.realbyteapps.com/hc/en-us/articles/360042701994-How-to-add-an-income-expense).
- **Baseline behavior:** A chronological list of the signed-in user's income and expense records, showing date, category, account, payee/note if present, and signed amount. Date grouping is `Proposed` and follows D-009 (user's local calendar day).
- **Not in baseline:** calendar, weekly, monthly, and summary review views (F-014); search (F-009); filters (F-010).
- **Decisions applied:** D-009 (date semantics), D-005 (design tokens in [UI.md](./UI.md) §6).
- **Open questions:** None.

### F-006 — Single configurable currency

- **Status:** `Decided (D-003)`.
- **Behavior:** Each user profile stores one currency. All amounts in lists, forms, and balances are displayed in that currency using locale-appropriate formatting. There is no conversion, no per-account currency, and no sub-currency feature.
- **Acceptance criteria:**
  - A user can change the currency setting.
  - `PHP` is available in the currency selector; `USD` remains the default (**D-017**).
  - Changing the setting does not alter stored amounts; it only changes display formatting.
- **Open questions:** None. Phase 1 uses the fixed ISO-style list in `src/domain/currency.ts`, defaulting to `USD`; `PHP` was added by the owner and recorded as **D-017**.

### F-007 — PWA installability

- **Status:** `Decided (D-004)`.
- **Behavior:** The app exposes a web app manifest and icons so it can be installed. A minimal service worker is acceptable only if needed for installability. There is no offline cache of user data, no background sync, and no conflict handling.
- **Acceptance criteria:**
  - Manifest and icons are present and linked from the HTML entry point.
  - No feature relies on offline availability.
- **Open questions:** None.
- **Phase 1 implementation:** `vite-plugin-pwa` generates the manifest and a precache-only service worker for the application shell; no runtime user-data caching is configured.

### F-023 — Theme preference setting

- **Status:** `Decided (D-005)` — baseline; this expands D-001 to include a user-facing theme setting.
- **Behavior:** Settings offers a manual choice between light and dark. The default is light. The choice is stored in the user's profile and applied on every page, including after sign-out/sign-in on the same browser. No "system" mode or accent-color picker in the baseline.
- **Design source:** [UI.md](./UI.md) §6 defines the rose-accented tokens, Inter typography, light/dark values, and component styles. This is Pocket Ledger's own design, not the reference app's style settings.
- **Acceptance criteria:**
  - A new profile renders in light mode until the user changes it.
  - Switching to dark updates all themed surfaces, text, borders, and semantic colors using the token set.
  - The preference persists across reloads and sessions.
  - The saved theme is applied before first paint so there is no light-theme flash for dark-mode users.
- **Dependencies:** `theme` column on `profiles` (see [DATABASE.md](./DATABASE.md)), theme provider in the app shell (see [ARCHITECTURE.md](./ARCHITECTURE.md)).
- **Open questions:** None.
- **Phase 1 implementation:** `src/app/ThemeProvider.tsx` caches the choice under `pocket-ledger-theme`; the inline script in `index.html` applies it before first paint.

## 3. Feature status matrix

| ID | Feature | Status | Primary phase |
| --- | --- | --- | --- |
| F-001 | User authentication and data ownership | Decided (baseline prerequisite) | Phase 1 |
| F-002 | Accounts: create, edit, delete, list | Baseline | Phase 2 |
| F-003 | Income/expense categories | Baseline | Phase 2 |
| F-004 | Income and expense records | Baseline | Phase 2 |
| F-005 | Transaction history | Baseline | Phase 2 |
| F-006 | Single configurable currency | Baseline | Phase 1 |
| F-007 | PWA installability | Baseline | Phase 1 |
| F-023 | Theme preference setting | Baseline | Phase 1 |
| F-008 | Transfers between own accounts | Deferred | Phase 3 |
| F-009 | Transaction search | Deferred | Phase 3 |
| F-010 | Filters | Deferred | Phase 3 |
| F-011 | Bookmarks | Deferred | Phase 3 |
| F-012 | Budgets and carry-over | Deferred | Phase 4 |
| F-013 | Statistics | Deferred | Phase 4 |
| F-014 | Calendar/weekly/monthly/summary views | Deferred | Phase 4 |
| F-015 | Receipt photos | **Out of scope (D-014)** | — |
| F-016 | Daily notes/memos | Deferred | Phase 5 |
| F-017 | Recurring schedules and installments | Deferred | Phase 5 |
| F-018 | Debit/credit cards and settlement | Deferred | Phase 5 |
| F-019 | Account display options | Deferred | Phase 5 |
| F-020 | Subcategories | Deferred | Phase 5 |
| F-021 | Backup/restore and bulk import | Deferred | Phase 5 |
| F-022 | Offline data support | Deferred / optional | Phase 6 (open) |

## 4. Deferred features (do not implement in the baseline)

Each entry records the documented reference behavior so a later session does not have to re-research it. None of these are requirements for the first release.

### F-008 — Transfers between own accounts

- **Reference:** [How to record a transfer](https://help.realbyteapps.com/hc/en-us/articles/360042702534-How-to-record-a-transfer).
- Documented behavior: a transfer is between the user's own accounts; "From", "To", and amount are required; an optional fee is recorded as an expense from the source account; transfers do not appear in the transaction list; transfers are also used for cash withdrawals, credit card payments, savings, time deposits, insurance, and loans. Payments to or from other people are income/expense, not transfers.
- Do not add a `transfer` transaction type or transfer UI to the baseline.

### F-009 — Transaction search

- **Reference:** [How to search](https://help.realbyteapps.com/hc/en-us/articles/360046151974-How-to-search).
- Documented behavior: keyword search with autocomplete, plus search by period, account, and income/expense category.

### F-010 — Filters

- **Reference:** [How to use filter](https://help.realbyteapps.com/hc/en-us/articles/360043267433-How-to-use-filter).
- Documented behavior: combine period, income/expense, and account criteria; filters apply to income and expense records but not transfers.

### F-011 — Bookmarks

- **Reference:** [How to make a bookmark](https://help.realbyteapps.com/hc/en-us/articles/360042743374-How-to-make-a-bookmark).
- Documented behavior: bookmark frequently used transaction details from a transaction's edit screen; bookmarked records can be edited, deleted, and reordered; the date of a bookmarked entry is set to the present when used.

### F-012 — Budgets and carry-over

- **Reference:** [How to set up/modify/delete a budget](https://help.realbyteapps.com/hc/en-us/articles/360042743774-How-to-set-up-modify-delete-a-budget) and [How to turn on carry-over feature](https://help.realbyteapps.com/hc/en-us/articles/360043218993-How-to-turn-on-carry-over-feature).
- Documented behavior: category budgets with a default amount applied to all months unless overridden for a specific month; progress bars with a recommended-spending marker; monthly comparison chart; changing the default applies from the next month onward and does not overwrite month-specific overrides.

### F-013 — Statistics

- **Reference:** [Stats Tab](https://help.realbyteapps.com/hc/en-us/articles/360045310273-Stats-Tab).
- Documented behavior: category-based income/expense charts with ratio/occupancy, monthly default period, list/trend modes, period navigation, and drill-down from a category.

### F-014 — Calendar/weekly/monthly/summary review views

- **Reference:** [Home tab](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab).
- Documented behavior: calendar view with income/expense/balance and per-day entries; weekly and monthly comparisons; total view with budget status and asset-type breakdown.

### F-015 — Receipt photos (removed from scope)

- **Status:** `Out of scope (D-014)` — not deferred, not planned. The ID is retained for stable cross-references.
- Pocket Ledger has no photo or receipt attachment feature. Do not add photo UI, storage buckets, attachment tables, or photo fields to the record model.
- The reference guide documents photo attachments, but that behavior is deliberately not adopted.

### F-016 — Daily notes/memos

- **Reference:** [Home tab](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab) and [How to activate the note button](https://help.realbyteapps.com/hc/en-us/articles/4402477895833-How-to-activate-the-note-button).
- Documented behavior: a short memo can be added for a day.

### F-017 — Recurring schedules and installments

- **Reference:** [How to set up a repeat schedule & installment](https://help.realbyteapps.com/hc/en-us/articles/360046668993-How-to-set-up-a-repeat-schedule-installment).
- Documented behavior: repeat entries appear only on the scheduled date (with a setting to show them on the first day of the month); installments split a purchase across months using accrual accounting; installment progress and remaining balance are viewable.

### F-018 — Debit and credit cards

- **Reference:** [How to add debit & credit card accounts](https://help.realbyteapps.com/hc/en-us/articles/360046340034-How-to-add-debit-credit-card-accounts) and [How to settle credit card payments](https://help.realbyteapps.com/hc/en-us/articles/360015963554-How-to-settle-credit-card-payments).
- Documented behavior: credit cards require a billing account, settlement date, and payment date; debit cards link to a checking account; card payment is a transfer from the billing account; overdue amounts are displayed distinctly; early payment is possible.

### F-019 — Account display options

- **References:** [How to hide accounts](https://help.realbyteapps.com/hc/en-us/articles/6886350924057-How-to-hide-accounts) · [How to manage account group](https://help.realbyteapps.com/hc/en-us/articles/360046936354-How-to-manage-account-group) · [How to exclude balance of certain accounts from totals](https://help.realbyteapps.com/hc/en-us/articles/360046152154-How-to-exclude-balance-of-certain-accounts-from-totals) · [How to manage deleted accounts](https://help.realbyteapps.com/hc/en-us/articles/360046976973-How-to-manage-deleted-accounts).
- Documented behavior: hidden accounts still contribute to totals in the reference app; accounts can be grouped and reordered; certain balances can be excluded from totals.

### F-020 — Subcategories

- **References:** [How to enable sub-category](https://help.realbyteapps.com/hc/en-us/articles/360015963374-How-to-enable-sub-category) and the related category articles in the guide's Category section.
- Documented behavior: subcategories can be enabled in configuration, added under a main category, and promoted to main categories.

### F-021 — Backup, restore, and bulk import

- **References:** [How to backup and restore data](https://help.realbyteapps.com/hc/en-us/articles/360042747934-How-to-backup-and-restore-data) and [How to import bulk data by Excel file](https://help.realbyteapps.com/hc/en-us/articles/360043223253-How-to-import-bulk-data-by-Excel-file).
- Documented behavior: the reference app supports backup/restore and Excel-based bulk import, including sub-currency imports.
- Pocket Ledger's hosted database changes the meaning of backup/restore; no behavior is decided yet.

### F-022 — Offline data support (optional)

- Not a Money Manager feature; listed because the platform requirement mentions PWA support. **D-004** limits the baseline to installability. Any offline editing/sync work must be a new decision with its own conflict-resolution design.

## 5. Rules for AI coding sessions

1. Implement only features whose status is baseline and whose phase is current or earlier in [ROADMAP.md](./ROADMAP.md).
2. Do not infer deferred behavior from the reference guide and silently add it.
3. Where a behavior is marked `Reference`, keep the linked article as the requirement source; where it is `Proposed`, get confirmation before treating it as fixed.
4. If a user asks for a deferred feature, update **D-001** and this inventory first so the docs stay consistent.
