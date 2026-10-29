import type { Member, PresenceStatus } from "./types";

// After this long without a refresh, "at uni" can't be trusted any more
// (e.g. the phone died on campus) — see "Stale status rule" in docs/SPEC.md.
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

// What the screen shows. Same as PresenceStatus plus "unknown", which only exists
// on the device — the server never stores it.
export type DisplayStatus = PresenceStatus | "unknown";

// `now` is a parameter (not read inside) so tests can pretend it's any time of day.
export function getDisplayStatus(member: Member, now: Date): DisplayStatus {
  // Ghost mode wins, no matter how old the row is.
  if (member.status === "hidden") {
    return "hidden";
  }

  const ageMs = now.getTime() - member.updatedAt.getTime();
  if (member.status === "at_uni" && ageMs > STALE_AFTER_MS) {
    return "unknown";
  }

  return member.status;
}

// "09:05" in the phone's local time zone. Written by hand instead of
// toLocaleTimeString() so the output is identical on every device and in tests.
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getStatusLabel(member: Member, now: Date): string {
  switch (getDisplayStatus(member, now)) {
    case "at_uni": {
      // `since`, not `updatedAt`: a refresh without a status change mustn't move this time.
      const since = `At uni since ${formatTime(member.since)}`;
      return member.building === null ? since : `${since} · near building ${member.building}`;
    }
    case "not_at_uni":
      return "Not at uni";
    case "hidden":
      return "Hidden";
    case "unknown":
      return "Unknown";
  }
}

// People at uni first, then everyone else; alphabetical within each group.
// Returns a new array and leaves the input untouched, because React relies on
// state never being changed in place.
export function sortMembers(members: Member[], now: Date): Member[] {
  return [...members].sort((a, b) => {
    const aAtUni = getDisplayStatus(a, now) === "at_uni";
    const bAtUni = getDisplayStatus(b, now) === "at_uni";
    if (aAtUni !== bAtUni) {
      return aAtUni ? -1 : 1;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}
