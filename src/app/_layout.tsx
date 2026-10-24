import { Stack } from "expo-router";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";

import { SessionProvider, useSession } from "@/features/auth/SessionProvider";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { MyGroupProvider, useMyGroup } from "@/features/groups/MyGroupProvider";

export default function RootLayout() {
  return (
    <SessionProvider>
      {/* Inside SessionProvider because it needs to know who is signed in. */}
      <MyGroupProvider>
        <RootNavigator />
      </MyGroupProvider>
    </SessionProvider>
  );
}

// A separate component because the hooks below only work *inside* the providers.
function RootNavigator() {
  const { session, isLoading: isSessionLoading } = useSession();
  const { group, isLoading: isGroupLoading, error: groupError, reload } = useMyGroup();

  const isSignedIn = session !== null;
  const hasGroup = group !== null;

  // Until we know who is signed in and whether they have a group, we don't know which
  // screens to allow — so show a spinner instead of guessing.
  if (isSessionLoading || (isSignedIn && isGroupLoading)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isSignedIn && groupError !== null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{groupError}</Text>
        <Button title="Try again" onPress={reload} />
        <View style={styles.signOut}>
          <SignOutButton />
        </View>
      </View>
    );
  }

  // Stack.Protected hides screens whose guard is false; when the state changes,
  // Expo Router moves the user to a screen that is allowed. Exactly one guard is true.
  return (
    <Stack>
      <Stack.Protected guard={isSignedIn && hasGroup}>
        <Stack.Screen
          name="index"
          options={{ title: "Who's at uni", headerRight: () => <SignOutButton /> }}
        />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn && !hasGroup}>
        <Stack.Screen
          name="group-setup"
          options={{ title: "Your group", headerRight: () => <SignOutButton /> }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ title: "Uni Radar" }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
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
  signOut: {
    marginTop: 24,
  },
});
