import { FAKE_MEMBERS } from "./fake-members";
import type { Member } from "./types";

// Set to true to see the error screen on your phone. Keep false in commits.
const SIMULATE_FAILURE = false;
const FAKE_DELAY_MS = 1000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stand-in for the Supabase query in milestone 3. Same signature as the real one
// will have, so the screen won't need to change when we swap it.
export async function fetchMembers(): Promise<Member[]> {
  await wait(FAKE_DELAY_MS);

  if (SIMULATE_FAILURE) {
    throw new Error("Simulated network failure");
  }

  // A new array each time, like a real network response would be.
  return [...FAKE_MEMBERS];
}
