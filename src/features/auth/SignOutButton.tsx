import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { signOut } from "./auth-api";

// Shown in the header of the main screen.
export function SignOutButton() {
  async function handlePress() {
    try {
      await signOut();
    } catch (e) {
      Alert.alert("Couldn't sign out", e instanceof Error ? e.message : "Please try again.");
    }
  }

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Text style={styles.label}>Sign out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#1a73e8",
    fontSize: 16,
  },
});
