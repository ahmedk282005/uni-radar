// Turns Supabase Auth error codes into messages a user can act on.
// Kept separate from auth-api.ts so it can be unit-tested without a Supabase client.
export function getAuthErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return "That password is too weak. Try a longer one.";
    case "email_address_invalid":
      return "That email address isn't accepted. Please use a different one.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "signup_disabled":
      return "Creating new accounts is currently turned off.";
    default:
      // Includes network problems, which have no code.
      return "Something went wrong. Check your connection and try again.";
  }
}
