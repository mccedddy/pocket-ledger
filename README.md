# Pocket Ledger

A responsive, installable personal finance web app built with React, TypeScript, Vite, Tailwind CSS v4, and Supabase.

> Current phase: **Phase 1 — Foundation**. Authentication, profile settings, theming, currency display, and PWA installability are scaffolded. The ledger screens (accounts, categories, records, history) are Phase 2 and are intentionally not implemented yet.

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- The existing Supabase project `pocket-ledger` (region `ap-northeast-2`)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in the public Supabase values:

   ```bash
   cp .env.example .env.local
   ```

   - `VITE_SUPABASE_URL` — Project URL from Supabase → Project Settings → API.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — publishable key (`sb_publishable_...`) from the same page. Older projects' `VITE_SUPABASE_ANON_KEY` is also accepted as a fallback.
   - `VITE_APP_NAME` — optional; if blank, the app uses "Pocket Ledger".
   - Never put a `service_role` key in `.env.local` or any client-side file.

3. Apply the profile migrations:

   - Open the Supabase SQL editor for `pocket-ledger`.
   - Run `supabase/migrations/0001_profiles.sql`. This creates the `profiles` table, RLS policies, profile-creation trigger, and `updated_at` trigger.
   - Run `supabase/migrations/0002_profile_nickname.sql`. This adds the required `nickname` column, backfills existing rows, and updates the auth trigger. No other tables exist yet.

4. Configure Supabase Auth:

   - Supabase → Authentication → Providers → Email → turn **Confirm email** off. This lets `signUp()` return a session immediately and sends no email.
   - No auth redirect URL is needed; magic links and `/auth/callback` are not used.

5. Start the app:

   ```bash
   npm run dev
   ```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit and component tests |

## Authentication

Pocket Ledger uses Supabase email + password authentication (**D-015**). `/sign-up` collects a required 1–30 character nickname (**D-016**), email, password, and confirmation; `/sign-in` collects email and password. Confirmation is off, so sign-up creates a session immediately and no email is sent. A trigger on `auth.users` copies the nickname into the matching `profiles` row; the client also performs an idempotent upsert as a fallback.

Settings can change the required nickname, but cannot save it blank. The currency selector supports `PHP`; `USD` remains the default (**D-017**).

Magic links and `/auth/callback` are removed. Forgot-password/reset is deferred. Because no email is sent by the app, the Supabase built-in email rate limit no longer blocks sign-up.

## Design and theming

Semantic Tailwind v4 tokens are defined in `src/styles/theme.css`. Raw variables use the `--pl-*` prefix and are exposed as `--color-*` theme variables through `@theme inline`, so dark-mode swaps work. The light palette is the default. The manual light/dark choice is cached in `localStorage` under `pocket-ledger-theme` and applied by an inline script in `index.html` before first paint, then persisted in `profiles.theme`.

Fonts are bundled locally with `@fontsource/inter`; no font CDN is used.

## PWA

`vite-plugin-pwa` generates the manifest and a minimal service worker that precaches the application shell only. There is no offline data cache, background sync, or offline-edit UI, per decision **D-004**.

## Deployment

Vercel is the intended host, but the Vercel project does not exist yet. `vercel.json` records the Vite build command, output directory, and SPA rewrite. When the project is created, use PR previews plus auto-deploy from `main` (**D-013**). Do not commit production credentials; configure them in the Vercel dashboard.

## Documentation

Product decisions and phase status live in `docs/PRODUCT.md` and `docs/ROADMAP.md`. Read those before starting work on a later phase.
