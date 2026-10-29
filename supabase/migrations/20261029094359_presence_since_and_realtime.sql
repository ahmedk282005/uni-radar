-- Milestone 4: "at uni since …" timestamp + live updates for presence.
--
-- Two timestamps on presence, both stamped by the database (the app can't set either):
--   status_since → when the current status began   → "At uni since 09:12"
--   updated_at   → last update of any kind          → the 12 h "Unknown" rule
-- They differ once something refreshes the row without changing the status
-- (e.g. the background location check in milestone 5).


-- ===========================================================================
-- status_since
-- ===========================================================================

-- Existing rows start "now": good enough for the test accounts that exist so far.
alter table public.presence
  add column status_since timestamptz not null default now();

-- Replaces private.set_updated_at(), which only stamped updated_at.
create function private.set_presence_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();

  if new.status is distinct from old.status then
    new.status_since = now();
  else
    -- Only this trigger decides status_since, even for an admin editing the row.
    new.status_since = old.status_since;
  end if;

  return new;
end;
$$;

revoke execute on function private.set_presence_timestamps() from public, anon, authenticated;

drop trigger presence_set_updated_at on public.presence;
create trigger presence_set_timestamps
  before update on public.presence
  for each row execute function private.set_presence_timestamps();

drop function private.set_updated_at();

-- No grant change needed: authenticated can already read every presence column, and
-- may still only update (status, building) — status_since is not in that list.


-- ===========================================================================
-- Realtime
-- ===========================================================================

-- Supabase Realtime streams changes of the tables in this publication to subscribed
-- apps. Each change is checked against the subscriber's RLS policies, so friends only
-- hear about people in their own groups. The app listens to UPDATE events only:
-- Postgres can't apply RLS to DELETE events, so those would reach every subscriber.
alter publication supabase_realtime add table public.presence;
