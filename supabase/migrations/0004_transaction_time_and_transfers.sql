-- Phase 2 extension: editable local transaction time (D-009 amended) and
-- own-account transfers (D-018). Apply after 0003_core_ledger.sql.

-- Records: replace calendar date with local wall-clock date and time ----------

alter table public.transactions
  rename column occurred_on to occurred_at;

alter table public.transactions
  alter column occurred_at type timestamp using occurred_at::timestamp;

alter table public.transactions
  alter column occurred_at set default localtimestamp;

alter index public.transactions_user_occurred_idx
  rename to transactions_user_occurred_at_idx;

comment on column public.transactions.occurred_at is
  'Editable local date and time per amended D-009; no timezone conversion.';

-- Transfers -------------------------------------------------------------------

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamp not null default localtimestamp,
  from_account_id uuid not null,
  to_account_id uuid not null,
  amount numeric(14,2) not null check (amount > 0),
  fee_amount numeric(14,2) not null default 0 check (fee_amount >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_account_id <> to_account_id),
  foreign key (from_account_id, user_id)
    references public.accounts (id, user_id) on delete restrict,
  foreign key (to_account_id, user_id)
    references public.accounts (id, user_id) on delete restrict
);

comment on table public.transfers is
  'Own-account fund movements per D-018. Excluded from income/expense history.';
comment on column public.transfers.fee_amount is
  'Optional fee, treated as an expense from the source account in amended D-011.';

create index if not exists transfers_user_occurred_idx
  on public.transfers (user_id, occurred_at desc, created_at desc);
create index if not exists transfers_user_from_idx
  on public.transfers (user_id, from_account_id);
create index if not exists transfers_user_to_idx
  on public.transfers (user_id, to_account_id);

drop trigger if exists transfers_touch_updated_at on public.transfers;
create trigger transfers_touch_updated_at
  before update on public.transfers
  for each row execute function public.touch_updated_at();

alter table public.transfers enable row level security;

drop policy if exists "transfers_all_own" on public.transfers;
create policy "transfers_all_own" on public.transfers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
