create table if not exists public.toddler_tales_stories (
  id text primary key,
  child_name text not null,
  status text not null check (status in ('setup', 'listening', 'playing', 'complete')),
  session jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toddler_tales_stories_child_name_idx
  on public.toddler_tales_stories (child_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists toddler_tales_stories_set_updated_at on public.toddler_tales_stories;

create trigger toddler_tales_stories_set_updated_at
before update on public.toddler_tales_stories
for each row
execute function public.set_updated_at();
