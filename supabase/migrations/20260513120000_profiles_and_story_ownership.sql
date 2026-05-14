/* Profiles, story_settings, user_id on stories, auth sync triggers, RLS.
   Kept in sync with supabase/schema.sql (section after initial stories table). */

alter table public.toddler_tales_stories
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists toddler_tales_stories_user_id_idx
  on public.toddler_tales_stories (user_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  story_settings jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.compute_is_premium_email(em text)
returns boolean
language sql
immutable
as $$
  select coalesce(
    lower(trim(em)) = 'juampi.contact@gmail.com'
    or split_part(lower(trim(em)), '@', 2) = 'elevenlabs.io'
    or split_part(lower(trim(em)), '@', 2) = 'cursor.com',
    false
  );
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_premium)
  values (new.id, new.email, public.compute_is_premium_email(new.email))
  on conflict (id) do update set
    email = excluded.email,
    is_premium = public.compute_is_premium_email(excluded.email),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.sync_profile_email();

drop trigger if exists on_auth_user_updated_email on auth.users;

create trigger on_auth_user_updated_email
after update of email on auth.users
for each row execute function public.sync_profile_email();

insert into public.profiles (id, email, is_premium)
select id, email, public.compute_is_premium_email(email)
from auth.users
on conflict (id) do update set
  email = excluded.email,
  is_premium = public.compute_is_premium_email(excluded.email),
  updated_at = now();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter table public.toddler_tales_stories enable row level security;

drop policy if exists "toddler_tales_no_direct_api" on public.toddler_tales_stories;

create policy "toddler_tales_no_direct_api"
  on public.toddler_tales_stories
  for all
  to anon, authenticated
  using (false)
  with check (false);
