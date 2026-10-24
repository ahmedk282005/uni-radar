-- Milestone 3, step 4: groups, memberships, invite codes.
--
-- Who can see what after this migration:
--   groups, group_members   → only groups you are a member of
--   profiles, presence      → your own row + everyone who shares a group with you
-- Writing profiles/presence is still own-row only (unchanged from the previous migration).
--
-- The app can NOT insert into groups/group_members directly. It calls two functions
-- (create_group, join_group) instead, so invite codes can only be used to join a group,
-- never browsed or listed (docs/SPEC.md §8).


-- Cryptographically strong random bytes for invite codes. Supabase usually has this
-- already; "if not exists" makes the line harmless if so.
create extension if not exists pgcrypto with schema extensions;


-- ===========================================================================
-- Tables
-- ===========================================================================

create table public.groups (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 40),
  invite_code text not null unique,
  -- The group outlives its creator's account.
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index groups_created_by_idx on public.groups (created_by);

create table public.group_members (
  group_id bigint not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  -- One membership per person and group.
  primary key (group_id, user_id)
);

-- The primary key already covers lookups by group_id; "which groups am I in?" needs this.
create index group_members_user_id_idx on public.group_members (user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Read-only for signed-in users; all writes go through the functions below.
revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
grant select on table public.groups to authenticated;
grant select on table public.group_members to authenticated;
grant select, insert, update, delete on table public.groups to service_role;
grant select, insert, update, delete on table public.group_members to service_role;


-- ===========================================================================
-- Helper functions for the RLS policies
--
-- A policy on group_members that asked "which groups am I in?" by reading
-- group_members would trigger its own policy again → infinite recursion.
-- These SECURITY DEFINER helpers read the table without RLS and only ever return
-- data about the calling user, so the policies can use them safely.
-- ===========================================================================

-- Policies run as the signed-in user, who therefore needs to be able to reach these
-- functions. `private` is still not exposed by the Data API, so the app can't call
-- them directly.
grant usage on schema private to authenticated;

-- Ids of the groups the calling user belongs to.
create function private.my_group_ids()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select group_id
  from public.group_members
  where user_id = (select auth.uid());
$$;

-- Ids of everyone who shares at least one group with the calling user (including them).
create function private.my_group_member_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct user_id
  from public.group_members
  where group_id in (
    select group_id from public.group_members where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.my_group_ids() from public, anon;
revoke execute on function private.my_group_member_ids() from public, anon;
grant execute on function private.my_group_ids() to authenticated;
grant execute on function private.my_group_member_ids() to authenticated;


-- ===========================================================================
-- Policies
-- ===========================================================================

create policy "Members can read their groups"
  on public.groups for select
  to authenticated
  using (id in (select private.my_group_ids()));

create policy "Members can read memberships of their groups"
  on public.group_members for select
  to authenticated
  using (group_id in (select private.my_group_ids()));

-- Widen reading of profiles/presence from "own row" to "own row + my groups".
drop policy "Users can read their own profile" on public.profiles;
create policy "Users can read profiles of people in their groups"
  on public.profiles for select
  to authenticated
  using (
    (select auth.uid()) = id
    or id in (select private.my_group_member_ids())
  );

drop policy "Users can read their own presence" on public.presence;
create policy "Users can read presence of people in their groups"
  on public.presence for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or user_id in (select private.my_group_member_ids())
  );


-- ===========================================================================
-- Invite codes
-- ===========================================================================

-- 6 characters, e.g. "K7QX3M". No 0/O and 1/I/L, so codes are easy to read out and
-- type: 31 symbols → about 887 million possible codes.
create function private.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  random_bytes bytea := extensions.gen_random_bytes(6);
  code text := '';
begin
  for i in 0..5 loop
    -- byte (0–255) mod 31 picks a symbol; the tiny bias doesn't matter here.
    code := code || substr(alphabet, 1 + get_byte(random_bytes, i) % length(alphabet), 1);
  end loop;
  return code;
end;
$$;

revoke execute on function private.generate_invite_code() from public, anon, authenticated;


-- ===========================================================================
-- The two functions the app calls (RPC)
--
-- SECURITY DEFINER so they can write the tables the app can't. That's why each one:
-- checks that the caller is signed in, does exactly one job, and only ever acts for
-- auth.uid() — never for a user id passed in by the app.
-- ===========================================================================

create function public.create_group(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  new_group public.groups;
begin
  if caller is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  -- A clash with an existing code is very unlikely, but possible: just try a new one.
  loop
    begin
      insert into public.groups (name, invite_code, created_by)
      values (trim(group_name), private.generate_invite_code(), caller)
      returning * into new_group;
      exit;
    exception when unique_violation then
      -- loop again with a fresh code
    end;
  end loop;

  insert into public.group_members (group_id, user_id)
  values (new_group.id, caller);

  return new_group;
end;
$$;

create function public.join_group(code text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  found_group public.groups;
begin
  if caller is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  select * into found_group
  from public.groups
  where invite_code = upper(trim(code));

  if not found then
    -- Same message for every wrong code, so it reveals nothing about which codes exist.
    raise exception 'No group with this invite code.' using errcode = 'P0002';
  end if;

  -- Joining a group you're already in is harmless.
  insert into public.group_members (group_id, user_id)
  values (found_group.id, caller)
  on conflict do nothing;

  return found_group;
end;
$$;

-- New functions are callable by everyone by default; only signed-in users may call these.
revoke execute on function public.create_group(text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
