-- Declarative schema for profiles table
-- See: https://supabase.com/docs/guides/local-development/declarative-database-schemas

-- After editing, run: supabase db diff -f <short_description>

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    (
      (char_length(username::text) >= 3)
      and (char_length(username::text) <= 32)
    )
    and (username::text ~ '^[\w.-]+$'::text)
  ),
  constraint profiles_bio_length check ((char_length(bio) <= 10000))
);

alter table public.profiles enable row level security;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();
