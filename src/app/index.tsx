import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from "react-native";

import { MemberRow } from "@/components/MemberRow";
import { checkSupabaseConnection } from "@/features/auth/check-connection";
import { fetchMembers } from "@/features/presence/fetch-members";
import { sortMembers } from "@/features/presence/status-display";
import type { Member } from "@/features/presence/types";

const LOAD_ERROR = "Couldn't load your group. Check your connection and try again.";

export default function Index() {
  // Hooks must run in the same order on every render, so they all sit at the top,
  // before any early `return`.
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMembers() {
    try {
      const result = await fetchMembers();
      setMembers(result);
      setError(null);
    } catch {
      // Members are left untouched so a failed refresh doesn't wipe a list we already have.
      setError(LOAD_ERROR);
    }
  }

  async function handleInitialLoad() {
    setIsLoading(true);
    await loadMembers();
    setIsLoading(false);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadMembers();
    setIsRefreshing(false);
  }

  // Empty dependency list: run once when the screen first appears, not on every render.
  useEffect(() => {
    handleInitialLoad();
  }, []);

  // Temporary (milestone 3, step 1): pop-up showing whether Supabase is reachable. Removed in step 3.
  useEffect(() => {
    checkSupabaseConnection().then((message) => Alert.alert("Supabase", message));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Full-screen error only when there's nothing to show; otherwise a banner above the list.
  if (error !== null && members.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try again" onPress={handleInitialLoad} />
      </View>
    );
  }

  // Recomputed on every render, so a refresh also re-applies the 12 h "Unknown" rule.
  const now = new Date();
  const sortedMembers = sortMembers(members, now);

  return (
    <FlatList
      style={styles.list}
      data={sortedMembers}
      keyExtractor={(member) => member.id}
      renderItem={({ item }) => <MemberRow member={item} now={now} />}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={EmptyList}
      ListHeaderComponent={error !== null ? <Text style={styles.banner}>{error}</Text> : undefined}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  errorText: {
    marginBottom: 12,
    textAlign: "center",
    color: "#666666",
  },
  banner: {
    padding: 12,
    textAlign: "center",
    color: "#8a1c1c",
    backgroundColor: "#fdecea",
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
