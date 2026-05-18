create table public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (user_id) on delete cascade,
  title text not null,
  type text not null default 'offer',
  description text not null,
  public boolean not null default false,
  share_with_new_groups_default boolean not null default true,
  share_with_new_friends_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_type check (
    (type = 'offer'::text) or (type = 'request'::text)
  )
);

alter table public.posts enable row level security;

create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_posts_updated_at();
