-- Phase 1 update: nickname is collected during registration (D-016).

create or replace function public.clean_nickname(value text)
returns text
language sql
immutable
as $$
  select left(btrim(regexp_replace(coalesce(value, ''), '[[:space:]]+', ' ', 'g')), 30);
$$;

alter table public.profiles
  add column if not exists nickname text not null default 'Member';
alter table public.profiles alter column nickname set default 'Member';
alter table public.profiles alter column nickname set not null;

-- Backfill profiles created before this migration from signup metadata or email.
update public.profiles p
set nickname = coalesce(
  nullif(public.clean_nickname(u.raw_user_meta_data ->> 'nickname'), ''),
  nullif(public.clean_nickname(split_part(coalesce(u.email, ''), '@', 1)), ''),
  'Member'
)
from auth.users u
where u.id = p.id
  and p.nickname = 'Member';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_nickname_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_nickname_length
      check (char_length(btrim(nickname)) between 1 and 30);
  end if;
end $$;

comment on column public.profiles.nickname is
  'Required nickname collected at registration; 1-30 characters (D-016).';

-- Future signups copy the nickname from Supabase Auth metadata into the profile.
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
