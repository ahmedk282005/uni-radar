import type { Member, PresenceStatus } from "./types";

// One row of the query in fetch-members.ts, named as in the database:
// group_members → profiles (many-to-one) → presence (one-to-one, so an object, not a list).
export type MemberQueryRow = {
  user_id: string;
  profiles: {
    display_name: string;
    presence: {
      status: PresenceStatus;
      building: string | null;
      updated_at: string;
    } | null;
  } | null;
};

// Postgres sends microseconds ("…:00.123456+00:00"). JavaScript dates only have
// milliseconds, and some engines refuse to parse the extra digits, so they are cut off.
export function parseTimestamp(text: string): Date {
  return new Date(text.replace(/(\.\d{3})\d+/, "$1"));
}

// Converts a database row into the Member the screen uses, or null if the row can't
// be shown (no profile visible — shouldn't happen for members of the same group).
export function memberFromRow(row: MemberQueryRow): Member | null {
  if (row.profiles === null) {
    return null;
  }

  const presence = row.profiles.presence;
  // Every sign-up gets a presence row from the database trigger. If one is ever
  // missing, show "Not at uni" rather than crashing the whole list.
  if (presence === null) {
    return {
      id: row.user_id,
      displayName: row.profiles.display_name,
      status: "not_at_uni",
      building: null,
      updatedAt: new Date(0),
    };
  }

  return {
    id: row.user_id,
    displayName: row.profiles.display_name,
    status: presence.status,
    building: presence.building,
    updatedAt: parseTimestamp(presence.updated_at),
  };
}
