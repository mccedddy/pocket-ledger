-- D-020 balance correction: type-specific Difference seed categories.
-- No table or column changes: correction rows use the unified transactions table
-- and the opening balance remains accounts.initial_amount.

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
    ('Difference'::text, 'expense'::text, 7),
    ('Salary'::text, 'income'::text, 1),
    ('Bonus'::text, 'income'::text, 2),
    ('Difference'::text, 'income'::text, 3)
  ) as seed(name, type, sort_order)
  where not exists (
    select 1 from public.categories c
    where c.user_id = target_user
      and c.name = seed.name
      and c.type = seed.type
  );
end;
$$;

-- Backfill every existing profile, including users who already had the
-- original eight categories from 0003.
do $$
declare
  target_user uuid;
begin
  for target_user in select p.id from public.profiles p
  loop
    perform public.seed_categories(target_user);
  end loop;
end $$;
