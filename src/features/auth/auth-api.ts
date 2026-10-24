import { supabase } from "@/lib/supabase";

import { getAuthErrorMessage } from "./auth-errors";

// supabase-js returns { data, error } instead of throwing. These wrappers throw an Error
// whose message can be shown to the user as-is, so screens just use try/catch
// (the same style as fetchMembers).
//
// None of them navigate: SessionProvider hears about the new session and the root
// layout switches screens by itself.

export async function signUp(email: string, password: string, displayName: string): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    // Ends up in auth.users.raw_user_meta_data, where the database trigger
    // (private.handle_new_user) reads it to create the profile.
    options: { data: { display_name: displayName.trim() } },
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
  // Only happens if "Confirm email" gets switched on in the dashboard again.
  if (data.session === null) {
    throw new Error("Account created. Please confirm your email, then sign in.");
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function signOut(): Promise<void> {
  // "local" signs out this phone only. The default ("global") would also sign the
  // user out on every other device.
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}
