// Must match the alphabet in private.generate_invite_code() (groups migration):
// no 0/O and 1/I/L, so codes are easy to read out and type.
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 6;
// Same limit as the check constraint on groups.name in the database.
export const MAX_GROUP_NAME_LENGTH = 40;

// Friends copy codes out of chats, so case, spaces and dashes are ignored:
// " k7qx-3m " → "K7QX3M".
export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

// Returns a message to show, or null when the code could be valid.
// Whether a group with this code exists is only known after asking the server.
export function validateInviteCode(input: string): string | null {
  const code = normalizeInviteCode(input);
  if (code === "") {
    return "Please enter an invite code.";
  }
  const usesOnlyAllowedCharacters = [...code].every((char) => INVITE_CODE_ALPHABET.includes(char));
  if (code.length !== INVITE_CODE_LENGTH || !usesOnlyAllowedCharacters) {
    return "Invite codes have 6 letters and digits, e.g. K7QX3M.";
  }
  return null;
}

export function validateGroupName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") {
    return "Please give your group a name.";
  }
  if (trimmed.length > MAX_GROUP_NAME_LENGTH) {
    return `Group names can be at most ${MAX_GROUP_NAME_LENGTH} characters.`;
  }
  return null;
}

// Turns Postgres error codes from create_group/join_group into messages a user can act on.
export function getGroupErrorMessage(code: string | undefined): string {
  switch (code) {
    // Raised by join_group for an unknown code.
    case "P0002":
      return "No group with this invite code.";
    // Check constraint on groups.name.
    case "23514":
      return `Group names must be 1–${MAX_GROUP_NAME_LENGTH} characters.`;
    // Raised when the caller isn't signed in (e.g. the session expired).
    case "42501":
      return "Please sign in again.";
    default:
      return "Something went wrong. Check your connection and try again.";
  }
}
