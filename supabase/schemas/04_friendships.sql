create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.profiles (user_id) on delete cascade,
  target_id uuid not null references public.profiles (user_id) on delete cascade,
  status text not null default 'pending_sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_status check (
    (status = 'active'::text)
    or (status = 'pending_sent'::text)
    or (status = 'pending_received'::text)
  ),
  constraint friendships_no_self check ((source_id <> target_id)),
  unique (source_id, target_id)
);

alter table public.friendships enable row level security;

create or replace function public.set_friendships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger friendships_set_updated_at
  before update on public.friendships
  for each row
  execute function public.set_friendships_updated_at();
