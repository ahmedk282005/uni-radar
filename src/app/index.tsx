import { StyleSheet, View } from "react-native";

import { MemberRow } from "@/components/MemberRow";
import { FAKE_MEMBERS } from "@/features/presence/fake-members";
import { sortMembers } from "@/features/presence/status-display";

// Temporary preview of MemberRow; replaced by a FlatList in the next step.
export default function Index() {
  const now = new Date();
  const members = sortMembers(FAKE_MEMBERS, now);

  return (
    <View style={styles.container}>
      {members.map((member) => (
        <MemberRow key={member.id} member={member} now={now} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
