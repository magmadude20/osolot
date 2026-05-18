create table public.post_shared_memberships (
  post_id uuid not null references public.posts (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  primary key (post_id, membership_id)
);

alter table public.post_shared_memberships enable row level security;
