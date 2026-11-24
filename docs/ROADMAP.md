# Pocket Ledger — Roadmap

> Last updated: 2026-11-24
> Status: **Phase 1 implemented and sign-in verified.** Nickname editing and PHP currency support are in Settings; only two-user RLS verification remains. No Phase 2 features have been implemented.

## 1. How to use this roadmap

This is a dependency-ordered plan, not a schedule. There are no dates, estimates, or delivery commitments because none were specified. Phases follow the strict-minimum baseline decision **D-001** in [PRODUCT.md](./PRODUCT.md); feature IDs refer to [FEATURES.md](./FEATURES.md).

A phase may start only when its entry gates are satisfied. Completing a phase requires its exit criteria and a documentation update if any decision changed.

## 2. Phase overview

| Phase | Name | Features | Status |
| --- | --- | --- | --- |
| 0 | Documentation and decisions | This document set | Complete |
| 1 | Foundation | F-001, F-006, F-007, F-023 | Implemented; both migrations applied, sign-in verified, two-user RLS pending |
| 2 | Core ledger (baseline) | F-002, F-003, F-004, F-005 | Not started |
| 3 | Transaction usability | F-008, F-009, F-010, F-011 | Deferred |
| 4 | Planning and insights | F-012, F-013, F-014 | Deferred |
| 5 | Advanced features | F-016–F-021 | Deferred (F-015 out of scope) |
| 6 | Optional offline support | F-022 | Deferred, open |

## 3. Phase 0 — Documentation and decisions (complete)

**Deliverables:** `docs/PRODUCT.md`, `docs/FEATURES.md`, `docs/UI.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/ROADMAP.md`.

**Outcome:** Baseline scope and confirmed decisions D-001–D-014 are recorded. Q-005 is closed (no photos anywhere); Supabase name and region are fixed by **D-007** (`pocket-ledger`, `ap-northeast-2`), with only Vercel details of Q-006 deferred until deployment. All Phase 1 entry gates are resolved. No code was created.

## 4. Phase 1 — Foundation

**Scope:** F-001 (auth), F-006 (currency setting), F-007 (PWA installability), F-023 (theme setting and D-005 design tokens), plus project scaffolding and deployment plumbing from [ARCHITECTURE.md](./ARCHITECTURE.md).

**Entry gates:**

- Supabase project details are fixed by **D-007**: name `pocket-ledger`, region `ap-northeast-2`. Only the Vercel project/environment names in Q-006 remain, and they are not needed until deployment, which is deferred per **D-007**.
- D-008–D-011 settle money, dates, deletes, and balances for the first migration (see [DATABASE.md](./DATABASE.md) §9).
- D-012 settles state/data fetching (TanStack Query); D-013 records the future Vercel CI approach but does not block Phase 1.

**Work items:**

1. Scaffold React + TypeScript + Vite with Tailwind CSS v4; establish formatting/linting, folder structure, and the D-005 token file from the architecture and UI docs.
2. Create the Supabase schema migration and RLS policies for `profiles` only (currency plus `theme`, audit/type conventions).
3. Implement Supabase email + password sign-up/sign-in (with nickname), session handling, route guard, and sign-out.
4. Implement profile creation on signup (including nickname), nickname editing in Settings, and the single-currency setting with PHP support (F-006).
5. Implement the theme provider and manual light/dark toggle in Settings, default light, applied before first paint (F-023).
6. Add PWA manifest, icons, and minimal registration (F-007).
7. Prepare a Vercel-ready production build configuration and document local/Supabase environment variables without committing secrets. Do **not** create a Vercel project; deployment setup is deferred per **D-007** and Q-006. Use D-013 when deployment begins.

**Implementation notes (this session):** React + TypeScript + Vite, Tailwind CSS v4, TanStack Query, React Router, Supabase JS, and `vite-plugin-pwa` are installed. Source lives under `src/app`, `src/features`, `src/domain`, `src/data`, and `src/shared`. Both profile migrations are applied. Auth is email + password: `/sign-up` collects nickname, email, password, and confirmation; `/sign-in` collects email and password; magic links and `/auth/callback` are removed. Supabase email confirmation is off, and sign-in has been verified. Settings can change the required nickname and offers PHP in the currency selector while keeping USD default (**D-017**). The transactions route is a temporary placeholder for Phase 2. `.env.example`, `vercel.json`, PWA icons, and unit/component tests were added. Local lint, typecheck, tests, and production build pass. The environment is configured with `VITE_SUPABASE_PUBLISHABLE_KEY`; an anonymous REST read of `profiles` returned `200 []`, confirming RLS hides rows. Two-user RLS verification remains.

**Exit criteria:**

- A user can sign up with a nickname, sign in, and sign out; unauthenticated access to protected routes is blocked. *(Sign-up/sign-in verified; sign-out and two-user RLS verification pending.)*
- A user can change the nickname in Settings and cannot save it blank. *(Code complete; Supabase verification pending.)*
- The currency selector includes PHP and USD remains the default. *(Verified locally.)*
- RLS denies access to another user's profile. *(Anonymous read verified; two-user check pending.)*
- The currency setting persists and formats display values without mutating amounts. *(Code complete; Supabase verification pending.)*
- A new profile defaults to light; switching to dark persists, uses D-005 tokens, and does not flash light on reload. *(Code complete and pre-paint token script added; Supabase verification pending.)*
- The app is installable as a PWA with no offline-data behavior. *(Manifest and minimal service worker generated; browser install check pending.)*
- The production build succeeds locally; no secret keys are committed. **Verified.** Vercel deployment success is not a Phase 1 exit criterion because no Vercel project exists yet.

## 5. Phase 2 — Core ledger (baseline completion)

**Scope:** F-002 accounts, F-003 categories, F-004 income/expense records, F-005 transaction history.

**Entry gates:** Phase 1 exit criteria, including two-user RLS verification; D-006 seed migration verified during Phase 2; visual design follows D-005 and needs no further decision. Photos are out of scope per **D-014**.

**Work items:**

1. Add migrations for `accounts`, `categories`, `transactions`, indexes, and RLS (per [DATABASE.md](./DATABASE.md)).
2. Build account list/create/edit/delete screens with derived balances per **D-011**.
3. Build income/expense category list/create/edit/delete screens with type consistency.
4. Build record editor with the guide's required and optional fields (F-004).
5. Build chronological transaction history with empty/loading/error states (F-005).
6. Add tests for domain helpers, form validation, and RLS isolation.

**Exit criteria:**

- A signed-in user can create, edit, and delete accounts, categories, and income/expense records.
- Required-field and category-type validation prevents invalid records.
- A saved record appears in history and in the relevant account's balance calculation (rule **D-011**).
- A second user cannot read or modify the first user's rows.
- No deferred feature (transfers, filters, budgets, stats, recurring, cards) has been implemented, and no photo/receipt UI or storage exists (**D-014**).

## 6. Phase 3 — Transaction usability (deferred)

**Scope:** F-008 transfers, F-009 search, F-010 filters, F-011 bookmarks.

**Entry gates:** Phase 2 complete; **D-001 must be amended** to include these features; database design for transfers approved (a new DB design point, not present in the baseline schema).

**Notes:** The guide states transfers are between the user's own accounts, include optional fees, and do not appear in the transaction list; filters apply only to income/expense records; bookmarked entries use the current date when created. See [FEATURES.md](./FEATURES.md) §4 for source links.

**Exit criteria:** Each implemented feature has a feature ID, documented reference behavior, RLS-covered storage where applicable, and tests; the baseline history behavior is not broken.

## 7. Phase 4 — Planning and insights (deferred)

**Scope:** F-012 budgets and carry-over, F-013 statistics, F-014 calendar/weekly/monthly/summary review views.

**Entry gates:** Phase 3 complete (or explicitly skipped with owner approval); **D-001 amended**; period boundaries follow **D-009** (user-local calendar).

**Notes:** Budget defaults apply to all months unless overridden; changing a default does not rewrite month-specific overrides. Statistics are category-based with monthly default and list/trend modes. Both behaviors are documented in the guide and must not be guessed beyond it.

**Exit criteria:** Aggregations match documented reference semantics for simple test data; period boundaries use the confirmed timezone rule.

## 8. Phase 5 — Advanced features (deferred)

**Scope:** F-016 notes, F-017 recurring/installments, F-018 cards, F-019 account display options, F-020 subcategories, F-021 backup/import. F-015 (photos) is out of scope per **D-014** and is not part of this or any phase.

**Entry gates:** Phase 4 complete or explicitly skipped; **D-001 amended** per feature group. There is no photo-related gate; photos are out of scope (**D-014**).

**Notes:** Recurring and installment behavior includes accrual accounting and scheduled-date reflection. Card behavior includes billing account, settlement date, payment date, and settlement transfers. Hidden accounts still count toward totals in the reference app. Import/export needs a hosted-product definition because the reference app is local-first.

**Exit criteria:** Per-feature specs are added to [FEATURES.md](./FEATURES.md) before implementation; schema changes are added to [DATABASE.md](./DATABASE.md); RLS and tests cover new tables.

## 9. Phase 6 — Optional offline support

**Scope:** F-022 offline data support.

**Entry gates:** **D-004 changed** by the owner; a dedicated design for local persistence, synchronization, and conflict resolution is documented and approved.

**Notes:** This is not a Money Manager feature and is not part of "PWA support" as decided in D-004. Do not start it implicitly while doing PWA maintenance.

## 10. Change control for AI sessions

1. Check the current phase before starting work; baseline phases are 1–2 only.
2. If a task requires a deferred feature, stop and request a decision change to D-001 (or D-004 for offline support).
3. If a task depends on an open, blocking question, ask the owner rather than choosing silently; deferred Q-006 is only relevant at deployment.
4. After any accepted change, update this roadmap and the other affected docs in the same work session so the documentation remains consistent.
5. Do not add dates, owners, or status claims that are not backed by an actual decision.
