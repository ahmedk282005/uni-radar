import { getAuthErrorMessage } from "./auth-errors";
import { validateDisplayName, validateEmail, validatePassword } from "./validation";

describe("validateEmail", () => {
  test("accepts a normal address, ignoring surrounding spaces", () => {
    expect(validateEmail("lena@tuhh.de")).toBeNull();
    expect(validateEmail("  lena+test1@gmail.com  ")).toBeNull();
  });

  test("rejects an empty or blank address", () => {
    expect(validateEmail("")).toBe("Please enter your email.");
    expect(validateEmail("   ")).toBe("Please enter your email.");
  });

  test("rejects obvious typos", () => {
    const message = "That doesn't look like an email address.";
    expect(validateEmail("lena")).toBe(message);
    expect(validateEmail("lena@tuhh")).toBe(message);
    expect(validateEmail("lena tuhh@de.de")).toBe(message);
    expect(validateEmail("@tuhh.de")).toBe(message);
  });
});

describe("validatePassword", () => {
  test("requires at least 6 characters", () => {
    expect(validatePassword("12345")).toBe("Password must be at least 6 characters.");
    expect(validatePassword("123456")).toBeNull();
  });

  test("counts spaces as characters (they are allowed in passwords)", () => {
    expect(validatePassword("ab  cd")).toBeNull();
  });
});

describe("validateDisplayName", () => {
  test("accepts a normal name", () => {
    expect(validateDisplayName("Lena")).toBeNull();
  });

  test("rejects an empty or blank name", () => {
    const message = "Please enter a name your friends will recognise.";
    expect(validateDisplayName("")).toBe(message);
    expect(validateDisplayName("   ")).toBe(message);
  });

  test("allows exactly 40 characters, rejects 41 (same limit as the database)", () => {
    expect(validateDisplayName("a".repeat(40))).toBeNull();
    expect(validateDisplayName("a".repeat(41))).toBe("Name can be at most 40 characters.");
  });

  test("ignores surrounding spaces when counting", () => {
    expect(validateDisplayName(`  ${"a".repeat(40)}  `)).toBeNull();
  });
});

describe("getAuthErrorMessage", () => {
  test("explains known Supabase error codes", () => {
    expect(getAuthErrorMessage("invalid_credentials")).toBe("Wrong email or password.");
    expect(getAuthErrorMessage("user_already_exists")).toBe(
      "An account with this email already exists. Try signing in instead.",
    );
  });

  test("falls back to a generic message for unknown codes and network errors", () => {
    const fallback = "Something went wrong. Check your connection and try again.";
    expect(getAuthErrorMessage("something_new")).toBe(fallback);
    expect(getAuthErrorMessage(undefined)).toBe(fallback);
  });
});
