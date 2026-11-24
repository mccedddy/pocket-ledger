-- Phase 2 core ledger: accounts, categories, income/expense records (D-001).
-- Governing decisions: D-002 ownership, D-006 seed categories, D-008 money,
-- D-009 calendar dates, D-010 hard delete with restrict, D-011 derived balances.

-- Accounts -------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  initial_amount numeric(14,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on column public.accounts.initial_amount is
  'Opening balance; displayed balance is derived per D-011, never stored.';

-- Categories -----------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  type text not null check (type in ('income', 'expense')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (id, user_id, type)
);

-- Transactions (income and expense records only) ------------------------------

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  occurred_on date not null,
  account_id uuid not null,
  category_id uuid not null,
  amount numeric(14,2) not null check (amount > 0),
  payee text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (account_id, user_id)
    references public.accounts (id, user_id) on delete restrict,
  foreign key (category_id, user_id, type)
    references public.categories (id, user_id, type) on delete restrict
);

comment on column public.transactions.occurred_on is
  'Calendar day in the user local timezone per D-009; no time of day in the baseline.';
comment on column public.transactions.amount is
  'Magnitude only; the type column supplies direction (D-008).';

-- Indexes --------------------------------------------------------------------

create index if not exists transactions_user_occurred_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);
create index if not exists transactions_user_account_idx
  on public.transactions (user_id, account_id);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);
create index if not exists accounts_user_sort_idx
  on public.accounts (user_id, sort_order);
create index if not exists categories_user_type_sort_idx
  on public.categories (user_id, type, sort_order);

-- Audit timestamps ------------------------------------------------------------

drop trigger if exists accounts_touch_updated_at on public.accounts;
create trigger accounts_touch_updated_at
  before update on public.accounts
  for each row execute function public.touch_updated_at();

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists transactions_touch_updated_at on public.transactions;
create trigger transactions_touch_updated_at
  before update on public.transactions
  for each row execute function public.touch_updated_at();

-- Row-level security: every row belongs to exactly one auth user (D-002) ------

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "accounts_all_own" on public.accounts;
create policy "accounts_all_own" on public.accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "transactions_all_own" on public.transactions;
create policy "transactions_all_own" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Seed categories (D-006) -----------------------------------------------------

create or replace function public.seed_categories(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, sort_order)
  select target_user, seed.name, seed.type, seed.sort_order
  from (values
    ('Food'::text, 'expense'::text, 1),
    ('Transport'::text, 'expense'::text, 2),
    ('Wants'::text, 'expense'::text, 3),
    ('Rent'::text, 'expense'::text, 4),
    ('Bills'::text, 'expense'::text, 5),
    ('Necessities'::text, 'expense'::text, 6),
    ('Salary'::text, 'income'::text, 1),
    ('Bonus'::text, 'income'::text, 2)
  ) as seed(name, type, sort_order)
  where not exists (
    select 1 from public.categories c
    where c.user_id = target_user
      and c.name = seed.name
      and c.type = seed.type
  );
end;
$$;

-- Future signups keep the Phase 1 nickname behavior and gain seed categories.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_nickname text := coalesce(
    nullif(public.clean_nickname(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(public.clean_nickname(split_part(coalesce(new.email, ''), '@', 1)), ''),
    'Member'
  );
begin
  insert into public.profiles (id, nickname)
  values (new.id, chosen_nickname)
  on conflict (id) do nothing;

  perform public.seed_categories(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles created in Phase 1 (they have no categories yet).
do $$
declare
  target_user uuid;
begin
  for target_user in
    select p.id from public.profiles p
    where not exists (select 1 from public.categories c where c.user_id = p.id)
  loop
    perform public.seed_categories(target_user);
  end loop;
end $$;
