create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  applied_at timestamptz not null default now(),
  joined_at timestamptz,
  updated_at timestamptz not null default now(),
  application_message text not null default '',
  approved_by uuid references public.profiles (user_id) on delete set null,
  status text not null default 'active',
  role text not null default 'member',
  constraint memberships_status check (
    (status = 'active'::text) or (status = 'pending'::text)
  ),
  constraint memberships_role check (
    (role = 'admin'::text)
    or (role = 'moderator'::text)
    or (role = 'member'::text)
  ),
  unique (group_id, user_id)
);

create index memberships_group_id_user_id_idx on public.memberships (group_id, user_id);

alter table public.memberships enable row level security;

create or replace function public.set_memberships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row
  execute function public.set_memberships_updated_at();
