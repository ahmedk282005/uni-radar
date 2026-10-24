import { supabase } from "@/lib/supabase";

// Temporary (milestone 3, step 1): proves on the phone that the app reaches Supabase
// with the key from .env. Delete once sign-in exists (step 3).
export async function checkSupabaseConnection(): Promise<string> {
  // Reads the stored session from SQLite — proves the storage works (no network needed).
  const { error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return `Session storage failed: ${sessionError.message}`;
  }

  // A real request to the database API.
  const { error } = await supabase.from("profiles").select("id").limit(1);
  // PGRST205 means "table not found": the server answered and accepted the key,
  // we just haven't created any tables yet (that's step 2).
  if (error === null || error.code === "PGRST205") {
    return "Connected to Supabase ✓";
  }
  return `Supabase error: ${error.message}`;
}
