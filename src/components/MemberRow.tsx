import { StyleSheet, Text, View } from "react-native";

import {
  getDisplayStatus,
  getStatusLabel,
  type DisplayStatus,
} from "@/features/presence/status-display";
import type { Member } from "@/features/presence/types";

// Record<DisplayStatus, string> forces a colour for every status:
// if a status is added later and forgotten here, the type-check fails.
const DOT_COLORS: Record<DisplayStatus, string> = {
  at_uni: "#2e9e4f",
  not_at_uni: "#b0b0b0",
  hidden: "#7a6fbf",
  unknown: "#e0a030",
};

type MemberRowProps = {
  member: Member;
  // Passed in rather than read here so the whole list uses the same moment.
  now: Date;
};

export function MemberRow({ member, now }: MemberRowProps) {
  const status = getDisplayStatus(member, now);

  return (
    <View style={styles.row}>
      {/* The dot is only decoration; the label text carries the meaning for screen readers. */}
      <View style={[styles.dot, { backgroundColor: DOT_COLORS[status] }]} />
      <View style={styles.text}>
        <Text style={styles.name}>{member.displayName}</Text>
        <Text style={styles.status}>{getStatusLabel(member, now)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  status: {
    marginTop: 2,
    fontSize: 14,
    color: "#666666",
  },
});
