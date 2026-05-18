create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  visibility text not null default 'public',
  admission_type text not null default 'open',
  application_question text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_description_length check ((char_length(description) <= 10000)),
  constraint groups_visibility check (
    (visibility = 'public'::text) or (visibility = 'unlisted'::text)
  ),
  constraint groups_admission_type check (
    (admission_type = 'open'::text) or (admission_type = 'application'::text)
  )
);

alter table public.groups enable row level security;

create or replace function public.set_groups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger groups_set_updated_at
  before update on public.groups
  for each row
  execute function public.set_groups_updated_at();
