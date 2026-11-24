# Pocket Ledger — Roadmap

> Last updated: 2026-11-24
> Status: **Documentation only.** No application features have been implemented.

## 1. How to use this roadmap

This is a dependency-ordered plan, not a schedule. There are no dates, estimates, or delivery commitments because none were specified. Phases follow the strict-minimum baseline decision **D-001** in [PRODUCT.md](./PRODUCT.md); feature IDs refer to [FEATURES.md](./FEATURES.md).

A phase may start only when its entry gates are satisfied. Completing a phase requires its exit criteria and a documentation update if any decision changed.

## 2. Phase overview

| Phase | Name | Features | Status |
| --- | --- | --- | --- |
| 0 | Documentation and decisions | This document set | Complete |
| 1 | Foundation | F-001, F-006, F-007, F-023 | Not started |
| 2 | Core ledger (baseline) | F-002, F-003, F-004, F-005 | Not started |
| 3 | Transaction usability | F-008, F-009, F-010, F-011 | Deferred |
| 4 | Planning and insights | F-012, F-013, F-014 | Deferred |
| 5 | Advanced features | F-015–F-021 | Deferred |
| 6 | Optional offline support | F-022 | Deferred, open |

## 3. Phase 0 — Documentation and decisions (complete)

**Deliverables:** `docs/PRODUCT.md`, `docs/FEATURES.md`, `docs/UI.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/ROADMAP.md`.

**Outcome:** Baseline scope, confirmed decisions D-001–D-005 (including the D-005 design system), and open questions Q-001–Q-010 are recorded; Q-004 is resolved by D-005. No code was created.

## 4. Phase 1 — Foundation

**Scope:** F-001 (auth), F-006 (currency setting), F-007 (PWA installability), F-023 (theme setting and D-005 design tokens), plus project scaffolding and deployment plumbing from [ARCHITECTURE.md](./ARCHITECTURE.md).

**Entry gates:**

- Q-006 answered: Supabase project, Vercel project, region, and environment names.
- Q-001, Q-002, Q-007, Q-008 answered well enough to write the first migration (see [DATABASE.md](./DATABASE.md) §9).
- Q-009 answered: data-fetching/state approach.
- Q-010 answered: branch/CI approach for Vercel previews and production.

**Work items:**

1. Scaffold React + TypeScript + Vite with Tailwind CSS v4; establish formatting/linting, folder structure, and the D-005 token file from the architecture and UI docs.
2. Create the Supabase schema migration and RLS policies for `profiles` only (currency plus `theme`, audit/type conventions).
3. Implement Supabase email sign-in, session handling, route guard, and sign-out.
4. Implement profile creation on signup and the single-currency setting (F-006).
5. Implement the theme provider and manual light/dark toggle in Settings, default light, applied before first paint (F-023).
6. Add PWA manifest, icons, and minimal registration (F-007).
7. Connect Vercel deployment and document environment variables without committing secrets.

**Exit criteria:**

- A user can sign in and sign out; unauthenticated access to protected routes is blocked.
- RLS denies access to another user's profile.
- The currency setting persists and formats display values without mutating amounts.
- A new profile defaults to light; switching to dark persists, uses D-005 tokens, and does not flash light on reload.
- The app is installable as a PWA with no offline-data behavior.
- Production and preview builds succeed; no secret keys are committed.

## 5. Phase 2 — Core ledger (baseline completion)

**Scope:** F-002 accounts, F-003 categories, F-004 income/expense records, F-005 transaction history.

**Entry gates:** Phase 1 exit criteria; Q-003 answered if seed data is desired; Q-005 does not block this phase; visual design follows D-005 and needs no further decision.

**Work items:**

1. Add migrations for `accounts`, `categories`, `transactions`, indexes, and RLS (per [DATABASE.md](./DATABASE.md)).
2. Build account list/create/edit/delete screens with derived balances once Q-008 is resolved.
3. Build income/expense category list/create/edit/delete screens with type consistency.
4. Build record editor with the guide's required and optional fields (F-004).
5. Build chronological transaction history with empty/loading/error states (F-005).
6. Add tests for domain helpers, form validation, and RLS isolation.

**Exit criteria:**

- A signed-in user can create, edit, and delete accounts, categories, and income/expense records.
- Required-field and category-type validation prevents invalid records.
- A saved record appears in history and in the relevant account's balance calculation (rule Q-008).
- A second user cannot read or modify the first user's rows.
- No deferred feature (transfers, filters, budgets, stats, photos, recurring, cards) has been implemented.

## 6. Phase 3 — Transaction usability (deferred)

**Scope:** F-008 transfers, F-009 search, F-010 filters, F-011 bookmarks.

**Entry gates:** Phase 2 complete; **D-001 must be amended** to include these features; database design for transfers approved (a new DB design point, not present in the baseline schema).

**Notes:** The guide states transfers are between the user's own accounts, include optional fees, and do not appear in the transaction list; filters apply only to income/expense records; bookmarked entries use the current date when created. See [FEATURES.md](./FEATURES.md) §4 for source links.

**Exit criteria:** Each implemented feature has a feature ID, documented reference behavior, RLS-covered storage where applicable, and tests; the baseline history behavior is not broken.

## 7. Phase 4 — Planning and insights (deferred)

**Scope:** F-012 budgets and carry-over, F-013 statistics, F-014 calendar/weekly/monthly/summary review views.

**Entry gates:** Phase 3 complete (or explicitly skipped with owner approval); **D-001 amended**; Q-002 resolved for period boundaries.

**Notes:** Budget defaults apply to all months unless overridden; changing a default does not rewrite month-specific overrides. Statistics are category-based with monthly default and list/trend modes. Both behaviors are documented in the guide and must not be guessed beyond it.

**Exit criteria:** Aggregations match documented reference semantics for simple test data; period boundaries use the confirmed timezone rule.

## 8. Phase 5 — Advanced features (deferred)

**Scope:** F-015 receipt photos, F-016 notes, F-017 recurring/installments, F-018 cards, F-019 account display options, F-020 subcategories, F-021 backup/import.

**Entry gates:** Phase 4 complete or explicitly skipped; **D-001 amended** per feature group; Q-005 answered before photo storage work.

**Notes:** Recurring and installment behavior includes accrual accounting and scheduled-date reflection. Card behavior includes billing account, settlement date, payment date, and settlement transfers. Hidden accounts still count toward totals in the reference app. Import/export needs a hosted-product definition because the reference app is local-first.

**Exit criteria:** Per-feature specs are added to [FEATURES.md](./FEATURES.md) before implementation; schema changes are added to [DATABASE.md](./DATABASE.md); RLS and tests cover new tables.

## 9. Phase 6 — Optional offline support

**Scope:** F-022 offline data support.

**Entry gates:** **D-004 changed** by the owner; a dedicated design for local persistence, synchronization, and conflict resolution is documented and approved.

**Notes:** This is not a Money Manager feature and is not part of "PWA support" as decided in D-004. Do not start it implicitly while doing PWA maintenance.

## 10. Change control for AI sessions

1. Check the current phase before starting work; baseline phases are 1–2 only.
2. If a task requires a deferred feature, stop and request a decision change to D-001 (or D-004 for offline support).
3. If a task depends on an open question, ask the owner rather than choosing silently.
4. After any accepted change, update this roadmap and the other affected docs in the same work session so the documentation remains consistent.
5. Do not add dates, owners, or status claims that are not backed by an actual decision.
