create table public.post_shared_friendships (
  post_id uuid not null references public.posts (id) on delete cascade,
  friendship_id uuid not null references public.friendships (id) on delete cascade,
  primary key (post_id, friendship_id)
);

alter table public.post_shared_friendships enable row level security;
