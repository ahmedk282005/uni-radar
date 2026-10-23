import { FlatList, StyleSheet, Text, View } from "react-native";

import { MemberRow } from "@/components/MemberRow";
import { FAKE_MEMBERS } from "@/features/presence/fake-members";
import { sortMembers } from "@/features/presence/status-display";

export default function Index() {
  // One shared moment for the whole list, so every row applies the 12 h rule identically.
  const now = new Date();
  const members = sortMembers(FAKE_MEMBERS, now);

  return (
    <FlatList
      style={styles.list}
      data={members}
      keyExtractor={(member) => member.id}
      renderItem={({ item }) => <MemberRow member={item} now={now} />}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={EmptyList}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function EmptyList() {
  return <Text style={styles.empty}>No one in your group yet.</Text>;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#dddddd",
    // Starts under the name, not under the dot (row padding 16 + dot 12 + gap 12).
    marginLeft: 40,
  },
  empty: {
    padding: 24,
    textAlign: "center",
    color: "#666666",
  },
});
