// Checked on the phone before anything is sent: instant feedback for typos.
// The server still enforces its own rules — these are a convenience, not security.

// Supabase Auth's default minimum.
export const MIN_PASSWORD_LENGTH = 6;
// Same limit as the check constraint on profiles.display_name in the database.
export const MAX_DISPLAY_NAME_LENGTH = 40;

// Each function returns a message to show, or null when the value is fine.

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed === "") {
    return "Please enter your email.";
  }
  // Deliberately loose (something@something.something): Supabase does the real check.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "That doesn't look like an email address.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  // Not trimmed: spaces are allowed in passwords.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  if (trimmed === "") {
    return "Please enter a name your friends will recognise.";
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return `Name can be at most ${MAX_DISPLAY_NAME_LENGTH} characters.`;
  }
  return null;
}
