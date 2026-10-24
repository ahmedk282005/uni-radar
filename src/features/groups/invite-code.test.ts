import {
  getGroupErrorMessage,
  INVITE_CODE_ALPHABET,
  normalizeInviteCode,
  validateGroupName,
  validateInviteCode,
} from "./invite-code";

describe("INVITE_CODE_ALPHABET", () => {
  test("has 31 different symbols and none that are easy to mix up", () => {
    expect(new Set(INVITE_CODE_ALPHABET).size).toBe(31);
    for (const confusing of ["0", "O", "1", "I", "L"]) {
      expect(INVITE_CODE_ALPHABET).not.toContain(confusing);
    }
  });
});

describe("normalizeInviteCode", () => {
  test("upper-cases and removes spaces and dashes", () => {
    expect(normalizeInviteCode("k7qx3m")).toBe("K7QX3M");
    expect(normalizeInviteCode("  K7Q X3M ")).toBe("K7QX3M");
    expect(normalizeInviteCode("k7q-x3m")).toBe("K7QX3M");
  });
});

describe("validateInviteCode", () => {
  test("accepts a well-formed code however it is typed", () => {
    expect(validateInviteCode("K7QX3M")).toBeNull();
    expect(validateInviteCode(" k7q-x3m ")).toBeNull();
  });

  test("asks for a code when the field is empty", () => {
    expect(validateInviteCode("")).toBe("Please enter an invite code.");
    expect(validateInviteCode("  -  ")).toBe("Please enter an invite code.");
  });

  test("rejects wrong length and characters that are never used", () => {
    const message = "Invite codes have 6 letters and digits, e.g. K7QX3M.";
    expect(validateInviteCode("K7QX3")).toBe(message);
    expect(validateInviteCode("K7QX3MM")).toBe(message);
    expect(validateInviteCode("WRONG1")).toBe(message); // "1" is not in the alphabet
    expect(validateInviteCode("K0QX3M")).toBe(message); // zero
    expect(validateInviteCode("K7QX3!")).toBe(message);
  });
});

describe("validateGroupName", () => {
  test("accepts a normal name", () => {
    expect(validateGroupName("TUHH Lerngruppe")).toBeNull();
  });

  test("rejects an empty or blank name", () => {
    expect(validateGroupName("")).toBe("Please give your group a name.");
    expect(validateGroupName("   ")).toBe("Please give your group a name.");
  });

  test("allows exactly 40 characters, rejects 41 (same limit as the database)", () => {
    expect(validateGroupName("a".repeat(40))).toBeNull();
    expect(validateGroupName("a".repeat(41))).toBe("Group names can be at most 40 characters.");
  });
});

describe("getGroupErrorMessage", () => {
  test("explains the errors our database functions raise", () => {
    expect(getGroupErrorMessage("P0002")).toBe("No group with this invite code.");
    expect(getGroupErrorMessage("42501")).toBe("Please sign in again.");
  });

  test("falls back to a generic message", () => {
    const fallback = "Something went wrong. Check your connection and try again.";
    expect(getGroupErrorMessage("XX000")).toBe(fallback);
    expect(getGroupErrorMessage(undefined)).toBe(fallback);
  });
});
