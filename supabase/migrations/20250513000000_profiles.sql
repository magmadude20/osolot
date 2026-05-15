-- profiles: one row per auth user; username optional (null after DELETE)

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or (
      char_length(username) between 3 and 32
      and username ~ '^[a-z0-9_]+$'
    )
  )
);

create unique index profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null;

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
