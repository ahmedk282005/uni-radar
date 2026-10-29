import {
  formatTime,
  getDisplayStatus,
  getStatusLabel,
  sortMembers,
} from "./status-display";
import type { Member } from "./types";

// A fixed "now" so results never depend on when the tests run.
// Months are 0-based in JavaScript: 9 = October.
const NOW = new Date(2026, 9, 23, 14, 0);

function hoursBefore(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

// Builds a valid Member; each test only spells out the fields it cares about.
function makeMember(overrides: Partial<Member>): Member {
  return {
    id: "1",
    displayName: "Lena",
    status: "at_uni",
    building: null,
    since: hoursBefore(1),
    updatedAt: hoursBefore(1),
    ...overrides,
  };
}

describe("getDisplayStatus", () => {
  test("recent 'at uni' stays 'at uni'", () => {
    expect(getDisplayStatus(makeMember({ updatedAt: hoursBefore(11.9) }), NOW)).toBe("at_uni");
  });

  test("'at uni' exactly 12 h old is still trusted", () => {
    expect(getDisplayStatus(makeMember({ updatedAt: hoursBefore(12) }), NOW)).toBe("at_uni");
  });

  test("'at uni' older than 12 h becomes 'unknown'", () => {
    expect(getDisplayStatus(makeMember({ updatedAt: hoursBefore(12.1) }), NOW)).toBe("unknown");
  });

  test("old 'not at uni' stays 'not at uni'", () => {
    const member = makeMember({ status: "not_at_uni", updatedAt: hoursBefore(48) });
    expect(getDisplayStatus(member, NOW)).toBe("not_at_uni");
  });

  test("ghost mode wins even when the row is old", () => {
    const member = makeMember({ status: "hidden", updatedAt: hoursBefore(48) });
    expect(getDisplayStatus(member, NOW)).toBe("hidden");
  });
});

describe("formatTime", () => {
  test("pads hours and minutes to two digits", () => {
    expect(formatTime(new Date(2026, 9, 23, 9, 5))).toBe("09:05");
    expect(formatTime(new Date(2026, 9, 23, 0, 0))).toBe("00:00");
    expect(formatTime(new Date(2026, 9, 23, 23, 59))).toBe("23:59");
  });
});

describe("getStatusLabel", () => {
  const arrived = new Date(2026, 9, 23, 9, 12);

  test("at uni with a building", () => {
    const member = makeMember({ building: "H", since: arrived, updatedAt: arrived });
    expect(getStatusLabel(member, NOW)).toBe("At uni since 09:12 · near building H");
  });

  test("at uni without a building (poor GPS accuracy)", () => {
    const member = makeMember({ building: null, since: arrived, updatedAt: arrived });
    expect(getStatusLabel(member, NOW)).toBe("At uni since 09:12");
  });

  test("shows when the status began, not when the row was last refreshed", () => {
    const member = makeMember({ since: arrived, updatedAt: hoursBefore(0.5) });
    expect(getStatusLabel(member, NOW)).toBe("At uni since 09:12");
  });

  test("a long day at uni with regular refreshes is not 'Unknown'", () => {
    // Arrived 13 h ago, but the phone refreshed 1 h ago: the 12 h rule looks at updatedAt.
    const member = makeMember({ since: hoursBefore(13), updatedAt: hoursBefore(1) });
    expect(getDisplayStatus(member, NOW)).toBe("at_uni");
  });

  test("not at uni", () => {
    expect(getStatusLabel(makeMember({ status: "not_at_uni" }), NOW)).toBe("Not at uni");
  });

  test("hidden", () => {
    expect(getStatusLabel(makeMember({ status: "hidden" }), NOW)).toBe("Hidden");
  });

  test("stale 'at uni' shows 'Unknown', not the old building", () => {
    const member = makeMember({ building: "D", updatedAt: hoursBefore(13) });
    expect(getStatusLabel(member, NOW)).toBe("Unknown");
  });
});

describe("sortMembers", () => {
  const felix = makeMember({ id: "f", displayName: "Felix", status: "not_at_uni" });
  const jonas = makeMember({ id: "j", displayName: "Jonas", status: "at_uni" });
  const lena = makeMember({ id: "l", displayName: "Lena", status: "at_uni" });
  const sara = makeMember({ id: "s", displayName: "Sara", status: "hidden" });
  const tobias = makeMember({ id: "t", displayName: "Tobias", updatedAt: hoursBefore(13) });

  function names(members: Member[]): string[] {
    return members.map((m) => m.displayName);
  }

  test("people at uni first, then everyone else, alphabetical within each group", () => {
    const sorted = sortMembers([tobias, sara, lena, felix, jonas], NOW);
    expect(names(sorted)).toEqual(["Jonas", "Lena", "Felix", "Sara", "Tobias"]);
  });

  test("a stale 'at uni' is not sorted to the top", () => {
    const sorted = sortMembers([tobias, felix], NOW);
    expect(names(sorted)).toEqual(["Felix", "Tobias"]);
  });

  test("does not change the input array", () => {
    const input = [lena, felix, jonas];
    sortMembers(input, NOW);
    expect(names(input)).toEqual(["Lena", "Felix", "Jonas"]);
  });
});
