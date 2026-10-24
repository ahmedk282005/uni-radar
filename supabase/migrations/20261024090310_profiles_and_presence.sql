-- Milestone 3, step 2: profiles + presence.
--
-- Privacy (CLAUDE.md): presence stores status + building only — never coordinates,
-- and one row per user, overwritten on update — never a history.
--
-- For now everyone can read/update only their OWN rows. "Friends in my group can see
-- me" needs the groups tables and is added in the next migration.
--
-- Since 2026-05 new Supabase projects no longer expose new tables to the Data API
-- automatically, so every table below grants access explicitly. Signed-out users
-- (role `anon`) get no access at all.


-- ===========================================================================
-- profiles: one row per signed-up user
-- ===========================================================================

create table public.profiles (
  -- Same id as the login user; deleting the login deletes the profile.
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
-- Only these columns can be changed from the app; id and created_at stay as created.
grant update (display_name, avatar_url) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- WITH CHECK stops a user from rewriting a row so that it belongs to someone else.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


-- ===========================================================================
-- presence: current status only (no history)
-- ===========================================================================

create table public.presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'not_at_uni'
    check (status in ('at_uni', 'not_at_uni', 'hidden')),
  building text check (char_length(building) between 1 and 40),
  updated_at timestamptz not null default now(),
  -- A building only makes sense while at uni — this also guarantees that ghost mode
  -- ("hidden") can never leak a building, whatever the app sends.
  constraint presence_building_only_at_uni check (status = 'at_uni' or building is null)
);

alter table public.presence enable row level security;

revoke all on table public.presence from anon, authenticated;
grant select on table public.presence to authenticated;
-- updated_at is not in this list: the trigger below sets it.
grant update (status, building) on table public.presence to authenticated;
grant select, insert, update, delete on table public.presence to service_role;

create policy "Users can read their own presence"
  on public.presence for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update their own presence"
  on public.presence for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- ===========================================================================
-- Trigger functions — in a `private` schema, which the Data API does not expose,
-- so they can't be called from the app.
-- ===========================================================================

create schema if not exists private;

-- The database (not the app) stamps updated_at, so nobody can fake a fresh timestamp
-- and dodge the 12 h "Unknown" rule.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger presence_set_updated_at
  before update on public.presence
  for each row execute function private.set_updated_at();

-- Runs when someone signs up: creates their profile and a "not at uni" presence row.
-- SECURITY DEFINER because sign-up runs as Supabase's auth service, which may not write
-- to our tables; this function runs with its owner's rights instead. That's also why it
-- must stay small, live in `private`, and pin search_path.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- From the sign-up form. Only ever displayed, never used for permissions:
    -- user metadata is editable by the user themself.
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 40), ''), 'New user')
  );

  insert into public.presence (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Postgres lets everyone execute new functions by default; these are only for triggers.
revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
