import { Pressable, StyleSheet, Text, View } from "react-native";

import { shareInvite } from "./share-invite";
import type { Group } from "./types";

// Top of the "Who's at uni" list: which group this is, and its code for inviting more friends.
export function GroupBar({ group }: { group: Group }) {
  return (
    <View style={styles.bar}>
      <View style={styles.text}>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={styles.code} selectable>
          Invite code: {group.inviteCode}
        </Text>
      </View>
      <Pressable onPress={() => shareInvite(group)} hitSlop={8}>
        <Text style={styles.link}>Share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f4f6f8",
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  code: {
    marginTop: 2,
    fontSize: 14,
    color: "#555555",
  },
  link: {
    color: "#1a73e8",
    fontSize: 16,
  },
});
