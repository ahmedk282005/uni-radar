import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { createGroup, joinGroup } from "@/features/groups/groups-api";
import {
  INVITE_CODE_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  validateGroupName,
  validateInviteCode,
} from "@/features/groups/invite-code";
import { useMyGroup } from "@/features/groups/MyGroupProvider";
import { shareInvite } from "@/features/groups/share-invite";
import type { Group } from "@/features/groups/types";

// Shown to signed-in users who aren't in a group yet.
export default function GroupSetup() {
  const { setGroup } = useMyGroup();

  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set right after creating, so the new code is shown before moving on to the list.
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  async function handleCreate() {
    const inputError = validateGroupName(groupName);
    if (inputError !== null) {
      setCreateError(inputError);
      return;
    }
    setCreateError(null);
    setJoinError(null);
    setIsSubmitting(true);
    try {
      setCreatedGroup(await createGroup(groupName));
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin() {
    const inputError = validateInviteCode(inviteCode);
    if (inputError !== null) {
      setJoinError(inputError);
      return;
    }
    setCreateError(null);
    setJoinError(null);
    setIsSubmitting(true);
    try {
      const group = await joinGroup(inviteCode);
      // Moves straight on to the list: the root layout reacts to the new group.
      setGroup(group);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  if (createdGroup !== null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>"{createdGroup.name}" is ready</Text>
        <Text style={styles.hint}>Send this code to your friends so they can join:</Text>
        <Text style={styles.code} selectable>
          {createdGroup.inviteCode}
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Share code" onPress={() => shareInvite(createdGroup)} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Continue" onPress={() => setGroup(createdGroup)} />
        </View>
        <Text style={styles.hint}>You'll also find the code at the top of the list.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Uni Radar works inside a private group. Join your friends' group with their code, or
        create a new one.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Join with a code</Text>
        <TextInput
          style={styles.input}
          placeholder="Invite code, e.g. K7QX3M"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          autoCorrect={false}
          // A little room for spaces/dashes pasted from a chat; they are removed anyway.
          maxLength={INVITE_CODE_LENGTH + 4}
        />
        {joinError !== null && <Text style={styles.error}>{joinError}</Text>}
        <Button title="Join group" onPress={handleJoin} disabled={isSubmitting} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a new group</Text>
        <TextInput
          style={styles.input}
          placeholder="Group name, e.g. TUHH Lerngruppe"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={MAX_GROUP_NAME_LENGTH}
        />
        {createError !== null && <Text style={styles.error}>{createError}</Text>}
        <Button title="Create group" onPress={handleCreate} disabled={isSubmitting} />
      </View>

      {isSubmitting && <ActivityIndicator style={styles.spinner} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  intro: {
    marginBottom: 24,
    fontSize: 15,
    color: "#444444",
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },
  cardTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontWeight: "600",
  },
  input: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
  },
  error: {
    marginBottom: 12,
    color: "#b3261e",
  },
  spinner: {
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  hint: {
    marginTop: 12,
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
  },
  code: {
    marginVertical: 20,
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 6,
  },
  buttonRow: {
    marginTop: 8,
    minWidth: 200,
  },
});
