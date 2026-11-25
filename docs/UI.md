# Pocket Ledger — UI and Interaction Design

> Last updated: 2026-11-25
> Status: **D-019 verified; D-020 approved; migration `0006_balance_correction.sql` authored and awaiting application.** The record screen handles Expense, Income, and Transfer with type-specific fields; the history is headerless, grouped by local day with signed totals and compact rows. The account editor now includes a balance-correction flow.

## 1. Purpose and constraints

This document describes the proposed information architecture, interaction patterns, and visual design system for the baseline defined in [PRODUCT.md](./PRODUCT.md) §7. The visual direction is **D-005** and is specified in §6; it is Pocket Ledger's own design, not a reproduction of the reference app's style.

Applicable decisions:

- **D-001** — strict minimum baseline; deferred features must not appear as working UI.
- **D-003** — one configurable currency per user, display-only formatting.
- **D-004** — installable PWA only; no offline data UI.
- **D-005** — rose-accented tokens, Inter, Tailwind CSS v4, manual light/dark theme with light default.
- **D-019** — one record screen for Expense/Income/Transfer; one headerless day-grouped history with signed totals.

Reference material for the overall structure is the [Home tab](https://help.realbyteapps.com/hc/en-us/articles/360046150874-Home-tab) and [How to add an income & expense](https://help.realbyteapps.com/hc/en-us/articles/360042701994-How-to-add-an-income-expense) articles in the Money Manager guide.

## 2. Proposed information architecture

Baseline navigation (all routes are implemented; React Router):

```text
/ (signed out)
├── /sign-in                     F-001  Supabase email + password sign-in
└── /sign-up                     F-001  Create account with nickname

/ (signed in)
├── /transactions                F-005  unified transaction history (default landing screen)
│   ├── /transactions/new        F-004  create expense, income, or transfer
│   └── /transactions/:id/edit   F-004  edit expense, income, or transfer
├── /accounts                    F-002  account list and balances
│   ├── /accounts/new            F-002  create account
│   └── /accounts/:id/edit       F-002  edit/delete account
├── /categories                  F-003  income and expense category lists
│   ├── /categories/new          F-003  create category
│   └── /categories/:id/edit     F-003  edit/delete category
└── /settings                    F-006, F-023  currency and theme settings
```

Phase 1 implemented `/sign-in`, `/sign-up`, a temporary `/transactions` placeholder, and `/settings`. Phase 2 replaced the placeholder with the real history and record routes and added all account and category routes. D-009 made record time editable; D-019 folds transfer creation into `/transactions/new` and removes the `/transfers` routes.

Notes:

- A persistent primary navigation exposes only the baseline destinations above.
- The reference app uses tab-style navigation (Transactions/Home, Stats, Accounts, More). A tab-style bar styled with **D-005** tokens is `Proposed`; it is a layout choice, not a requirement to copy the reference app.
- Future destinations for deferred features (Stats, bookmarks, budgets, search/filters, and so on) are listed in [FEATURES.md](./FEATURES.md) §4. They must not be shown as functional navigation in the baseline. Empty placeholders are `Proposed` only and need owner approval.

## 3. Baseline screen inventory

| Screen | Feature | Content | Status |
| --- | --- | --- | --- |
| Sign-in | F-001 | Email and password inputs, sign-in action, link to sign-up, authentication feedback. | `Decided` behavior (D-002, D-015) |
| Sign-up | F-001 | Nickname (1–30 chars), email, password, confirm password, link to sign-in. | `Decided` behavior (D-015, D-016) |
| Transaction history | F-005 | Headerless chronology grouped by local day. Each day starts with a date and signed income/expense totals shown as amounts only. Record rows have a fixed height and show only category, note, and signed amount; the account is secondary text under the note, and the transfer fee is secondary under the amount. Long note/account text is truncated rather than wrapped. Transfer rows show Category `Transfer`. Record time is not displayed in the history. Clicking or keyboard-activating a row opens that record in the editor; there are no table action buttons. Entry point to create a record. | `Proposed` layout; `Reference` data source |
| Record editor | F-004 | Type selector (Expense, Income, Transfer) plus shared date/time, amount, and note. Income/expense add account, category, and optional payee; transfer adds source account, destination account, and optional fee. Save and delete actions for existing records. | `Reference` fields; `Proposed` layout (D-019) |
| Account list | F-002 | Accounts with derived balances and links to add/edit. | `Proposed` layout; `Reference` concept |
| Account editor | F-002 | Name and opening balance; a balance-correction section comparing a user-entered **final** balance with the derived balance, offering `Log income`/`Log expense` with `Difference` + `Modified balance`, or adjusting the opening balance by the difference so the derived final balance matches the entry, with a no-ledger-entry notice; edit and delete actions. | `Reference` fields (guide: name and amount); `Proposed` layout (D-020) |
| Category list | F-003 | Separate income and expense category lists. New profiles show the ten seeded categories from D-006/D-020: expense — Food, Transport, Wants, Rent, Bills, Necessities, Difference; income — Salary, Bonus, Difference. | `Reference` concept; `Proposed` layout |
| Category editor | F-003 | Name and type; edit and delete actions. | `Proposed` |
| Settings | F-001, F-006, F-023 | Nickname editor (required), currency selector including PHP, and light/dark theme choice (default light). | `Decided` behavior (D-003, D-005, D-016, D-017); `Proposed` layout |

The reference app's "continue" button for consecutive entries and its daily memo button are documented but deferred; do not add them to the record editor in the baseline (see [FEATURES.md](./FEATURES.md) F-004, F-016).

## 4. Cross-cutting interaction rules

| Area | Rule | Basis |
| --- | --- | --- |
| Required fields | The record editor blocks save without a valid local date/time and positive amount for every type. Income/expense additionally require an account and category; transfer requires two distinct own accounts and a non-negative fee. | `Reference` + `Proposed` (F-004), `Decided` (D-019) |
| Nickname | Sign-up requires a 1–30 character nickname; Settings can change it but cannot set it to blank. No header display in this pass. | `Decided` (D-016) |
| Type/category consistency | Income records offer income categories; expense records offer expense categories; transfer has no category field. Switching type clears incompatible fields. | Derived from the guide plus `Decided` (D-019) |
| Currency display | All money uses the profile's single currency and locale formatting; changing it does not mutate stored values. | `Decided` (D-003) |
| Destructive actions | Confirmation before delete, with accessible cancel/confirm labels. | `Proposed` (security/usability convention, not specified by the guide) |
| Validation feedback | Field-level errors for missing/invalid required values; form-level error on save failure. | `Proposed` |
| Async states | Loading, empty, and error states for every data list; empty states invite the first create action. | `Proposed` |
| Auth states | Unauthenticated users are routed to sign-in; expired sessions prompt sign-in again without discarding unsaved input silently. | `Proposed` alongside `Decided` D-002 |
| Date/time input | The record editor uses a local `datetime-local` input for all three types, defaulting to the current local time; no timezone conversion is applied. Grouping/ordering use the user's local calendar day from that timestamp. | `Decided` (amended D-009) |
| Balance correction | In the account editor, entering a desired final balance that differs from the derived balance reveals two explicit choices: log the difference as an income/expense `Difference` record with note `Modified balance`, or adjust the opening balance **by the difference** so the derived final balance matches the entered value, with a clear no-ledger-entry notice. The entered value is never written directly to `initial_amount`. There is no silent correction. | `Decided` (D-020) |
| Record grouping/ordering | Chronological ordering by `occurred_at`, newest first; the unified history is grouped by local calendar day using a day-summary row, not a heading. | `Proposed`, `Decided` (D-019) |
| Record display | Expense/income: the account appears as secondary text under the note, with the payee when provided. Transfer: Category is `Transfer`, the account line is `source → destination`, the amount stays `−amount`, and the optional fee is secondary under the amount. Notes remain the primary note text; record time is not shown in the history. Record rows use a uniform fixed height with truncated note/account text. Rows are clickable/focusable and open the record editor; deletion stays inside that editor. | `Decided` (D-019) |
| Theme preference | Manual light/dark choice in Settings; default light; persisted in profile and applied before first paint. | `Decided` (D-005, F-023) |

## 5. Responsive behavior

- `Proposed`: mobile-first layout with a compact single-column form/list view; tablet and desktop widen content and may use side-by-side list/detail or a persistent sidebar.
- `Proposed`: primary create action uses a prominent button (FAB-style on small screens) on list screens.
- `Proposed`: navigation collapses to a bottom bar on small screens and a sidebar or top bar on larger screens.
- Breakpoints, spacing, and component styling follow the **D-005** design system in §6. No component library is used in the baseline; server data uses **D-012** (TanStack Query) and local form state.

## 6. Design system (D-005)

> Provisional: the owner chose "rose palette for now". Token values may be retuned later; keep the semantic token names and component structure stable when changing colors.

### 6.1 Principles

- Calm, high-signal interface: financial data should be scannable, not decorated.
- Compact on mobile, roomier on desktop; the same tokens drive both.
- Semantic color plus text/sign — never color alone — for income and expense.
- Accessible by default: AA contrast, visible focus, keyboard operability.

### 6.2 Color tokens

Tokens are CSS variables. Exact hex values are `Proposed` starting points; verify contrast in implementation.

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--color-primary` | `#E11D48` (rose-600) | `#FB7185` (rose-400) | Brand accent: primary buttons, links, active navigation. |
| `--color-primary-strong` | `#BE123C` (rose-700) | `#FDA4AF` (rose-300) | Hover/pressed states. |
| `--color-primary-soft` | `#FFE4E6` (rose-100) | `rgba(251,113,133,0.14)` | Selected/active backgrounds. |
| `--color-income` | `#059669` (emerald-600) | `#34D399` (emerald-400) | Positive amounts and income markers. |
| `--color-expense` | `#B91C1C` (red-700) | `#FCA5A5` (red-300) | Negative amounts and destructive actions; intentionally distinct from the rose brand accent. |
| `--color-warning` | `#D97706` (amber-600) | `#FBBF24` (amber-400) | Warnings and validation cautions. |
| `--color-surface` | `#FFFFFF` | `#0B1120` | Page/app background. |
| `--color-surface-subtle` | `#F8FAFC` | `#111827` | Striped rows, secondary panels. |
| `--color-surface-raised` | `#FFFFFF` | `#1F2937` | Cards, dialogs, dropdowns. |
| `--color-text` | `#0F172A` | `#F8FAFC` | Primary text. |
| `--color-text-muted` | `#64748B` | `#94A3B8` | Secondary text, labels, helpers. |
| `--color-border` | `#E2E8F0` | `#334155` | Borders and dividers (1px). |
| `--color-focus` | `--color-primary` | `--color-primary` | Focus ring, 2px with 2px offset. |

Do not use raw palette classes (for example `text-rose-600`) in feature code; use the semantic tokens above.

### 6.3 Typography

- **Font:** Inter, bundled with the app so rendering does not depend on a third-party font CDN. Fallback stack: system UI fonts.
- **Weights:** 400 regular, 500 medium, 600 semibold (headings/emphasis), 700 bold sparingly.
- **Scale:** 12px caption/helper, 14px body and table text, 16px subsection, 20px section title, 24px page title; line-height 1.5 for body, 1.2–1.3 for headings.
- **Amounts:** always `font-variant-numeric: tabular-nums`, right-aligned in lists, with `+`/`−` sign and semantic color.

### 6.4 Spacing, shape, and elevation

- 4px spacing scale: 4, 8, 12, 16, 24, 32. Use 16px screen gutters on mobile, 24px on larger screens.
- Border radius: 8px controls, 12px cards/dialogs, 999px pills/badges.
- Borders: 1px `--color-border`. Elevation: very subtle shadow for raised surfaces and dialogs only.
- Focus: 2px `--color-focus` ring with 2px offset on all interactive elements.
- Motion: 150–200ms ease for hover/state changes; respect reduced-motion preferences.

### 6.5 Component styles

| Component | Baseline rules |
| --- | --- |
| Button | Primary: filled `--color-primary`. Secondary: transparent with `--color-border`. Ghost: text-only. Destructive: filled `--color-expense`. Sizes: 32/40/44px height. States: hover, focus-visible, disabled (reduced opacity, no pointer), loading (spinner plus label). |
| Input / Select / Textarea | 40px control height, full width, 1px border, label above, 12px helper text. Error state uses `--color-expense` border plus message; focus uses the focus ring. |
| Segmented control | Expense/Income/Transfer selector with text labels; active segment uses `--color-primary-soft` background and `--color-primary` text. Never rely on color alone. |
| Card / list row | Raised surface, 12px radius, 1px border. Row anatomy: leading category/account text, muted date and payee, trailing tabular amount with sign and semantic color. |
| Badge | Pill shape with soft semantic background; used for record type and status. |
| Dialog / bottom sheet | Centered dialog on desktop, bottom sheet on mobile; backdrop, Escape/backdrop close, focus trapped and restored. |
| Toast | Short non-blocking feedback; bottom on mobile, top-right on desktop. |
| Navigation | Bottom bar on mobile, persistent sidebar on desktop; active item uses `--color-primary-soft` with `--color-primary` text. |

### 6.6 Theme behavior

- Light tokens live on `:root`; dark tokens are applied when `<html>` has the `dark` class.
- Default is light. F-023 stores the user's manual choice in `profiles.theme` (`light` or `dark`).
- Apply the saved preference before first paint to avoid a flash of the wrong theme.
- No `system` mode and no accent-color picker in the baseline; PWA manifest colors remain light.

### 6.7 Tailwind implementation notes

- Tailwind CSS v4, CSS-first configuration: `src/styles/theme.css` defines raw `--pl-*` variables on `:root` and `html.dark`, exposes them as semantic `--color-*` variables with `@theme inline` (so dark-mode variable swaps work), and configures the `dark` variant to target `.dark` on `<html>`.
- Use semantic utilities such as `bg-surface`, `text-muted`, `bg-income`, and `bg-expense` instead of raw color scales.
- Extract repeated class combinations into `shared/` components (`Button`, `Input`, `Card`, `ListRow`, `SegmentedControl`) rather than duplicating long strings in feature screens.
- No component library in the baseline. Headless accessibility primitives may be considered later if native controls are insufficient.

## 7. PWA support

Per **D-004**, the baseline PWA work is limited to:

- A web app manifest with name, icons, start URL, display mode, and theme/background colors.
- Icons in the formats required by target browsers.
- Minimal service-worker handling only if needed for installability; no offline data cache, no background sync, no offline-edit indicators.

Any UI that promises offline access must be rejected until **D-004** is changed.

## 8. Accessibility expectations (`Proposed`)

- Every input has a visible or programmatically associated label; icon-only controls have accessible names.
- Forms are operable by keyboard, with clear focus indication.
- Status colors are not the only signal for income/expense (text or icons accompany them).
- Error messages are announced and associated with the relevant field.
- Contrast and touch-target size follow the §6 token rules: AA contrast and minimum 44px touch targets.

## 9. Deferred UI surface

The following are documented in the guide but must not be built in the baseline: search screen (F-009), filter panel (F-010), bookmark list (F-011), budget settings and progress bars (F-012), charts (F-013), calendar/weekly/monthly/summary views (F-014), note UI (F-016), repeat/installment controls (F-017), card billing fields and payment flow (F-018), account hide/order/group/exclude controls (F-019), and subcategory management (F-020). Transfer entry (F-008) is now part of the record editor per **D-019**. Photo/receipt UI (F-015) is out of product scope entirely per **D-014**, not merely deferred.

## 10. Open questions and AI handoff

There are no open UI questions for the baseline. Resolved: Q-004 by **D-005** (palette is provisional), Q-002 by amended **D-009** (local date and time), Q-007 by **D-010** (hard delete with confirmation), Q-008 by amended **D-011** (derived balances including transfers). Auth UI is fixed by **D-015**, nickname editing by **D-016**, PHP currency support with USD default by **D-017**, and the unified three-type record screen/table by **D-019**.

When implementing a baseline screen: keep the route and component names in sync with this document and [FEATURES.md](./FEATURES.md), use the D-005 design tokens, and do not introduce a screen for a deferred feature.
