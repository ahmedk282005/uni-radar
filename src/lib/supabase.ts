// Gives supabase-js a browser-style `localStorage` backed by SQLite, so the login
// session survives app restarts. Must run before createClient below.
import "expo-sqlite/localStorage/install";

import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

// Expo copies EXPO_PUBLIC_ variables from .env into the app at build time. They must be
// written out literally like this (not process.env[name]) or Expo can't find them.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase settings. Copy .env.example to .env, fill in both values, then restart `npx expo start`.",
  );
}

// The only Supabase client in the app — import it from here, never create a second one.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only websites receive a session through the URL after a login redirect.
    detectSessionInUrl: false,
  },
});

// On a phone the token-refresh timer would keep running in the background and waste
// battery, so it only runs while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
