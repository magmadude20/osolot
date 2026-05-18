create extension if not exists "citext" with schema "extensions";

alter table "public"."profiles" drop constraint "profiles_username_format";

drop index if exists "public"."profiles_username_lower_uidx";


  create table "public"."friendships" (
    "id" uuid not null default gen_random_uuid(),
    "source_id" uuid not null,
    "target_id" uuid not null,
    "status" text not null default 'pending_sent'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."friendships" enable row level security;


  create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text not null,
    "visibility" text not null default 'public'::text,
    "admission_type" text not null default 'open'::text,
    "application_question" text not null default ''::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."groups" enable row level security;


  create table "public"."memberships" (
    "id" uuid not null default gen_random_uuid(),
    "group_id" uuid not null,
    "user_id" uuid not null,
    "applied_at" timestamp with time zone not null default now(),
    "joined_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default now(),
    "application_message" text not null default ''::text,
    "approved_by" uuid,
    "status" text not null default 'active'::text,
    "role" text not null default 'member'::text
      );


alter table "public"."memberships" enable row level security;


  create table "public"."post_shared_friendships" (
    "post_id" uuid not null,
    "friendship_id" uuid not null
      );


alter table "public"."post_shared_friendships" enable row level security;


  create table "public"."post_shared_memberships" (
    "post_id" uuid not null,
    "membership_id" uuid not null
      );


alter table "public"."post_shared_memberships" enable row level security;


  create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "title" text not null,
    "type" text not null default 'offer'::text,
    "description" text not null,
    "public" boolean not null default false,
    "share_with_new_groups_default" boolean not null default true,
    "share_with_new_friends_default" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."posts" enable row level security;

alter table "public"."profiles" add column "bio" text not null default ''::text;

alter table "public"."profiles" alter column "username" set not null;

alter table "public"."profiles" alter column "username" set data type extensions.citext using "username"::extensions.citext;

CREATE UNIQUE INDEX friendships_pkey ON public.friendships USING btree (id);

CREATE UNIQUE INDEX friendships_source_id_target_id_key ON public.friendships USING btree (source_id, target_id);

CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id);

CREATE INDEX memberships_group_id_user_id_idx ON public.memberships USING btree (group_id, user_id);

CREATE UNIQUE INDEX memberships_group_id_user_id_key ON public.memberships USING btree (group_id, user_id);

CREATE UNIQUE INDEX memberships_pkey ON public.memberships USING btree (id);

CREATE UNIQUE INDEX post_shared_friendships_pkey ON public.post_shared_friendships USING btree (post_id, friendship_id);

CREATE UNIQUE INDEX post_shared_memberships_pkey ON public.post_shared_memberships USING btree (post_id, membership_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

alter table "public"."friendships" add constraint "friendships_pkey" PRIMARY KEY using index "friendships_pkey";

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";

alter table "public"."memberships" add constraint "memberships_pkey" PRIMARY KEY using index "memberships_pkey";

alter table "public"."post_shared_friendships" add constraint "post_shared_friendships_pkey" PRIMARY KEY using index "post_shared_friendships_pkey";

alter table "public"."post_shared_memberships" add constraint "post_shared_memberships_pkey" PRIMARY KEY using index "post_shared_memberships_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."friendships" add constraint "friendships_no_self" CHECK ((source_id <> target_id)) not valid;

alter table "public"."friendships" validate constraint "friendships_no_self";

alter table "public"."friendships" add constraint "friendships_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."friendships" validate constraint "friendships_source_id_fkey";

alter table "public"."friendships" add constraint "friendships_source_id_target_id_key" UNIQUE using index "friendships_source_id_target_id_key";

alter table "public"."friendships" add constraint "friendships_status" CHECK (((status = 'active'::text) OR (status = 'pending_sent'::text) OR (status = 'pending_received'::text))) not valid;

alter table "public"."friendships" validate constraint "friendships_status";

alter table "public"."friendships" add constraint "friendships_target_id_fkey" FOREIGN KEY (target_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."friendships" validate constraint "friendships_target_id_fkey";

alter table "public"."groups" add constraint "groups_admission_type" CHECK (((admission_type = 'open'::text) OR (admission_type = 'application'::text))) not valid;

alter table "public"."groups" validate constraint "groups_admission_type";

alter table "public"."groups" add constraint "groups_description_length" CHECK ((char_length(description) <= 10000)) not valid;

alter table "public"."groups" validate constraint "groups_description_length";

alter table "public"."groups" add constraint "groups_visibility" CHECK (((visibility = 'public'::text) OR (visibility = 'unlisted'::text))) not valid;

alter table "public"."groups" validate constraint "groups_visibility";

alter table "public"."memberships" add constraint "memberships_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL not valid;

alter table "public"."memberships" validate constraint "memberships_approved_by_fkey";

alter table "public"."memberships" add constraint "memberships_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_group_id_fkey";

alter table "public"."memberships" add constraint "memberships_group_id_user_id_key" UNIQUE using index "memberships_group_id_user_id_key";

alter table "public"."memberships" add constraint "memberships_role" CHECK (((role = 'admin'::text) OR (role = 'moderator'::text) OR (role = 'member'::text))) not valid;

alter table "public"."memberships" validate constraint "memberships_role";

alter table "public"."memberships" add constraint "memberships_status" CHECK (((status = 'active'::text) OR (status = 'pending'::text))) not valid;

alter table "public"."memberships" validate constraint "memberships_status";

alter table "public"."memberships" add constraint "memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_user_id_fkey";

alter table "public"."post_shared_friendships" add constraint "post_shared_friendships_friendship_id_fkey" FOREIGN KEY (friendship_id) REFERENCES public.friendships(id) ON DELETE CASCADE not valid;

alter table "public"."post_shared_friendships" validate constraint "post_shared_friendships_friendship_id_fkey";

alter table "public"."post_shared_friendships" add constraint "post_shared_friendships_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_shared_friendships" validate constraint "post_shared_friendships_post_id_fkey";

alter table "public"."post_shared_memberships" add constraint "post_shared_memberships_membership_id_fkey" FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE not valid;

alter table "public"."post_shared_memberships" validate constraint "post_shared_memberships_membership_id_fkey";

alter table "public"."post_shared_memberships" add constraint "post_shared_memberships_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_shared_memberships" validate constraint "post_shared_memberships_post_id_fkey";

alter table "public"."posts" add constraint "posts_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_owner_id_fkey";

alter table "public"."posts" add constraint "posts_type" CHECK (((type = 'offer'::text) OR (type = 'request'::text))) not valid;

alter table "public"."posts" validate constraint "posts_type";

alter table "public"."profiles" add constraint "profiles_bio_length" CHECK ((char_length(bio) <= 10000)) not valid;

alter table "public"."profiles" validate constraint "profiles_bio_length";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."profiles" add constraint "profiles_username_format" CHECK (((char_length((username)::text) >= 3) AND (char_length((username)::text) <= 32) AND ((username)::text ~ '^[\w.-]+$'::text))) not valid;

alter table "public"."profiles" validate constraint "profiles_username_format";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_friendships_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_groups_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_memberships_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_posts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

grant delete on table "public"."friendships" to "anon";

grant insert on table "public"."friendships" to "anon";

grant references on table "public"."friendships" to "anon";

grant select on table "public"."friendships" to "anon";

grant trigger on table "public"."friendships" to "anon";

grant truncate on table "public"."friendships" to "anon";

grant update on table "public"."friendships" to "anon";

grant delete on table "public"."friendships" to "authenticated";

grant insert on table "public"."friendships" to "authenticated";

grant references on table "public"."friendships" to "authenticated";

grant select on table "public"."friendships" to "authenticated";

grant trigger on table "public"."friendships" to "authenticated";

grant truncate on table "public"."friendships" to "authenticated";

grant update on table "public"."friendships" to "authenticated";

grant delete on table "public"."friendships" to "service_role";

grant insert on table "public"."friendships" to "service_role";

grant references on table "public"."friendships" to "service_role";

grant select on table "public"."friendships" to "service_role";

grant trigger on table "public"."friendships" to "service_role";

grant truncate on table "public"."friendships" to "service_role";

grant update on table "public"."friendships" to "service_role";

grant delete on table "public"."groups" to "anon";

grant insert on table "public"."groups" to "anon";

grant references on table "public"."groups" to "anon";

grant select on table "public"."groups" to "anon";

grant trigger on table "public"."groups" to "anon";

grant truncate on table "public"."groups" to "anon";

grant update on table "public"."groups" to "anon";

grant delete on table "public"."groups" to "authenticated";

grant insert on table "public"."groups" to "authenticated";

grant references on table "public"."groups" to "authenticated";

grant select on table "public"."groups" to "authenticated";

grant trigger on table "public"."groups" to "authenticated";

grant truncate on table "public"."groups" to "authenticated";

grant update on table "public"."groups" to "authenticated";

grant delete on table "public"."groups" to "service_role";

grant insert on table "public"."groups" to "service_role";

grant references on table "public"."groups" to "service_role";

grant select on table "public"."groups" to "service_role";

grant trigger on table "public"."groups" to "service_role";

grant truncate on table "public"."groups" to "service_role";

grant update on table "public"."groups" to "service_role";

grant delete on table "public"."memberships" to "anon";

grant insert on table "public"."memberships" to "anon";

grant references on table "public"."memberships" to "anon";

grant select on table "public"."memberships" to "anon";

grant trigger on table "public"."memberships" to "anon";

grant truncate on table "public"."memberships" to "anon";

grant update on table "public"."memberships" to "anon";

grant delete on table "public"."memberships" to "authenticated";

grant insert on table "public"."memberships" to "authenticated";

grant references on table "public"."memberships" to "authenticated";

grant select on table "public"."memberships" to "authenticated";

grant trigger on table "public"."memberships" to "authenticated";

grant truncate on table "public"."memberships" to "authenticated";

grant update on table "public"."memberships" to "authenticated";

grant delete on table "public"."memberships" to "service_role";

grant insert on table "public"."memberships" to "service_role";

grant references on table "public"."memberships" to "service_role";

grant select on table "public"."memberships" to "service_role";

grant trigger on table "public"."memberships" to "service_role";

grant truncate on table "public"."memberships" to "service_role";

grant update on table "public"."memberships" to "service_role";

grant delete on table "public"."post_shared_friendships" to "anon";

grant insert on table "public"."post_shared_friendships" to "anon";

grant references on table "public"."post_shared_friendships" to "anon";

grant select on table "public"."post_shared_friendships" to "anon";

grant trigger on table "public"."post_shared_friendships" to "anon";

grant truncate on table "public"."post_shared_friendships" to "anon";

grant update on table "public"."post_shared_friendships" to "anon";

grant delete on table "public"."post_shared_friendships" to "authenticated";

grant insert on table "public"."post_shared_friendships" to "authenticated";

grant references on table "public"."post_shared_friendships" to "authenticated";

grant select on table "public"."post_shared_friendships" to "authenticated";

grant trigger on table "public"."post_shared_friendships" to "authenticated";

grant truncate on table "public"."post_shared_friendships" to "authenticated";

grant update on table "public"."post_shared_friendships" to "authenticated";

grant delete on table "public"."post_shared_friendships" to "service_role";

grant insert on table "public"."post_shared_friendships" to "service_role";

grant references on table "public"."post_shared_friendships" to "service_role";

grant select on table "public"."post_shared_friendships" to "service_role";

grant trigger on table "public"."post_shared_friendships" to "service_role";

grant truncate on table "public"."post_shared_friendships" to "service_role";

grant update on table "public"."post_shared_friendships" to "service_role";

grant delete on table "public"."post_shared_memberships" to "anon";

grant insert on table "public"."post_shared_memberships" to "anon";

grant references on table "public"."post_shared_memberships" to "anon";

grant select on table "public"."post_shared_memberships" to "anon";

grant trigger on table "public"."post_shared_memberships" to "anon";

grant truncate on table "public"."post_shared_memberships" to "anon";

grant update on table "public"."post_shared_memberships" to "anon";

grant delete on table "public"."post_shared_memberships" to "authenticated";

grant insert on table "public"."post_shared_memberships" to "authenticated";

grant references on table "public"."post_shared_memberships" to "authenticated";

grant select on table "public"."post_shared_memberships" to "authenticated";

grant trigger on table "public"."post_shared_memberships" to "authenticated";

grant truncate on table "public"."post_shared_memberships" to "authenticated";

grant update on table "public"."post_shared_memberships" to "authenticated";

grant delete on table "public"."post_shared_memberships" to "service_role";

grant insert on table "public"."post_shared_memberships" to "service_role";

grant references on table "public"."post_shared_memberships" to "service_role";

grant select on table "public"."post_shared_memberships" to "service_role";

grant trigger on table "public"."post_shared_memberships" to "service_role";

grant truncate on table "public"."post_shared_memberships" to "service_role";

grant update on table "public"."post_shared_memberships" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

CREATE TRIGGER friendships_set_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.set_friendships_updated_at();

CREATE TRIGGER groups_set_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_groups_updated_at();

CREATE TRIGGER memberships_set_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.set_memberships_updated_at();

CREATE TRIGGER posts_set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_posts_updated_at();


