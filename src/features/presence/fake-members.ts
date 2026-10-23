import type { Member } from "./types";

// Times are relative to "now" so the list looks realistic whenever you open the app.
function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

// Placeholder data until Supabase arrives in milestone 3.
// Each entry covers a case the screen must handle — keep them when editing.
export const FAKE_MEMBERS: Member[] = [
  // At uni, building known
  { id: "1", displayName: "Lena", status: "at_uni", building: "H", updatedAt: minutesAgo(25) },
  // At uni, building known, arrived more recently
  { id: "2", displayName: "Jonas", status: "at_uni", building: "N", updatedAt: minutesAgo(5) },
  // At uni, but GPS accuracy was too poor to pick a building
  { id: "3", displayName: "Mira", status: "at_uni", building: null, updatedAt: minutesAgo(90) },
  // Not at uni
  { id: "4", displayName: "Felix", status: "not_at_uni", building: null, updatedAt: minutesAgo(40) },
  // Ghost mode on
  { id: "5", displayName: "Sara", status: "hidden", building: null, updatedAt: minutesAgo(120) },
  // Said "at uni" 13 h ago and never updated (phone died?) → should show "Unknown"
  { id: "6", displayName: "Tobias", status: "at_uni", building: "D", updatedAt: minutesAgo(13 * 60) },
];
