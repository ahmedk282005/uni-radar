import { memberFromRow, parseTimestamp, type MemberQueryRow } from "./member-from-row";

describe("parseTimestamp", () => {
  test("reads Postgres timestamps with microseconds", () => {
    const date = parseTimestamp("2026-10-24T09:12:34.123456+00:00");
    expect(date.toISOString()).toBe("2026-10-24T09:12:34.123Z");
  });

  test("reads timestamps without fractional seconds", () => {
    expect(parseTimestamp("2026-10-24T09:12:34+00:00").toISOString()).toBe(
      "2026-10-24T09:12:34.000Z",
    );
  });

  test("respects the time zone offset", () => {
    expect(parseTimestamp("2026-10-24T11:12:34.5+02:00").toISOString()).toBe(
      "2026-10-24T09:12:34.500Z",
    );
  });
});

describe("memberFromRow", () => {
  const row: MemberQueryRow = {
    user_id: "u1",
    profiles: {
      display_name: "Lena",
      presence: { status: "at_uni", building: "H", updated_at: "2026-10-24T09:12:00.000000+00:00" },
    },
  };

  test("turns database names into app names", () => {
    expect(memberFromRow(row)).toEqual({
      id: "u1",
      displayName: "Lena",
      status: "at_uni",
      building: "H",
      updatedAt: new Date("2026-10-24T09:12:00.000Z"),
    });
  });

  test("keeps a missing building as null", () => {
    const notAtUni: MemberQueryRow = {
      user_id: "u2",
      profiles: {
        display_name: "Felix",
        presence: { status: "not_at_uni", building: null, updated_at: "2026-10-24T09:12:00+00:00" },
      },
    };
    expect(memberFromRow(notAtUni)?.building).toBeNull();
  });

  test("shows someone without a presence row as 'not at uni' instead of failing", () => {
    const member = memberFromRow({ user_id: "u3", profiles: { display_name: "Mira", presence: null } });
    expect(member?.status).toBe("not_at_uni");
    expect(member?.building).toBeNull();
  });

  test("skips a row whose profile isn't visible", () => {
    expect(memberFromRow({ user_id: "u4", profiles: null })).toBeNull();
  });
});
