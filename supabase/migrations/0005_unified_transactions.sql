-- D-019: one unified transactions ledger for Expense, Income, and Transfer.
-- Apply after 0004_transaction_time_and_transfers.sql. Existing transfer rows
-- are copied into transactions, then the separate transfers table is retired.

-- Transactions: widen the type and add transfer-only columns -------------------

alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'transfer'));

alter table public.transactions
  add column if not exists to_account_id uuid;

alter table public.transactions
  add column if not exists fee_amount numeric(14,2) not null default 0;

alter table public.transactions
  alter column category_id drop not null;

-- Source account and destination account must belong to the same user.
alter table public.transactions
  drop constraint if exists transactions_to_account_fkey;

alter table public.transactions
  add constraint transactions_to_account_fkey
  foreign key (to_account_id, user_id)
    references public.accounts (id, user_id) on delete restrict;

-- Type-specific shape: transfers have a destination and no category;
-- income/expense have a category and no destination.
alter table public.transactions
  drop constraint if exists transactions_type_shape_check;

alter table public.transactions
  add constraint transactions_type_shape_check
  check (
    (
      type = 'transfer'
      and to_account_id is not null
      and category_id is null
      and account_id <> to_account_id
      and fee_amount >= 0
    )
    or (
      type in ('income', 'expense')
      and to_account_id is null
      and category_id is not null
    )
  );

comment on table public.transactions is
  'Unified ledger per D-019: income, expense, and transfer rows for one user.';
comment on column public.transactions.type is
  'Row direction: income | expense | transfer (D-019).';
comment on column public.transactions.account_id is
  'Source/holding account. Expense decreases it; income increases it; transfer source decreases by amount + fee.';
comment on column public.transactions.to_account_id is
  'Transfer destination only; must differ from account_id.';
comment on column public.transactions.category_id is
  'Required for income/expense; null for transfers.';
comment on column public.transactions.fee_amount is
  'Transfer only; optional fee treated as an expense from the source account per amended D-011.';

-- Preserve existing transfers as unified transaction rows ----------------------

insert into public.transactions (
  id,
  user_id,
  type,
  occurred_at,
  account_id,
  to_account_id,
  category_id,
  amount,
  fee_amount,
  payee,
  note,
  created_at,
  updated_at
)
select
  t.id,
  t.user_id,
  'transfer'::text,
  t.occurred_at,
  t.from_account_id,
  t.to_account_id,
  null,
  t.amount,
  t.fee_amount,
  null,
  t.note,
  t.created_at,
  t.updated_at
from public.transfers t;

-- Indexes ---------------------------------------------------------------------

create index if not exists transactions_user_to_idx
  on public.transactions (user_id, to_account_id);

-- Retire the old transfers table ----------------------------------------------

drop table if exists public.transfers;
