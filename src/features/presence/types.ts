// Same three values as the `presence.status` column in the database (see docs/SPEC.md).
export type PresenceStatus = "at_uni" | "not_at_uni" | "hidden";

// One friend in the group, as the "Who's at uni" screen sees them.
// Deliberately no coordinates: the server only ever knows status + building (privacy rule 1).
export type Member = {
  id: string;
  displayName: string;
  status: PresenceStatus;
  // null when GPS accuracy was too poor to pick a building, or when not at uni.
  building: string | null;
  // When the current status began; shown as "At uni since 09:12".
  since: Date;
  // When the row was last refreshed (even without a status change); used for the
  // "Unknown after 12 h" rule.
  updatedAt: Date;
};
