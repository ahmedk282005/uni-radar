import { useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";

import { setMyStatus } from "./my-status";
import type { PresenceStatus } from "./types";

type MyStatusBarProps = {
  userId: string;
  // The user's current status, as loaded with the rest of the list.
  status: PresenceStatus;
  // Reloads the list. Awaited so the switch only lets go of its new position once
  // the list (and with it `status`) has caught up.
  onChanged: () => Promise<void>;
};

// The manual "I'm at uni" switch at the top of the list (milestone 4).
export function MyStatusBar({ userId, status, onChanged }: MyStatusBarProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // While saving, the switch shows the value the user just picked instead of jumping
  // back to the old `status` until the server answers.
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  if (status === "hidden") {
    return (
      <View style={styles.bar}>
        <Text style={styles.hidden}>You're hidden (ghost mode). Friends see "Hidden".</Text>
      </View>
    );
  }

  const isAtUni = pendingValue ?? status === "at_uni";

  async function handleChange(value: boolean) {
    setPendingValue(value);
    setIsSaving(true);
    setError(null);
    try {
      await setMyStatus(userId, value ? "at_uni" : "not_at_uni");
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your status.");
    } finally {
      // On an error this also moves the switch back to the saved status.
      setPendingValue(null);
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.label}>I'm at uni</Text>
          <Text style={styles.hint}>Your friends see this in their list.</Text>
        </View>
        {isSaving && <ActivityIndicator style={styles.spinner} />}
        <Switch
          value={isAtUni}
          onValueChange={handleChange}
          disabled={isSaving}
          accessibilityLabel="I'm at uni"
        />
      </View>
      {error !== null && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dddddd",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
  },
  hint: {
    marginTop: 2,
    fontSize: 13,
    color: "#666666",
  },
  spinner: {
    marginRight: 8,
  },
  hidden: {
    fontSize: 15,
    color: "#7a6fbf",
  },
  error: {
    marginTop: 8,
    color: "#b3261e",
  },
});
