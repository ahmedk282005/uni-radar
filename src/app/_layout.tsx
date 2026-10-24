import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { SessionProvider, useSession } from "@/features/auth/SessionProvider";
import { SignOutButton } from "@/features/auth/SignOutButton";

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

// A separate component because useSession() only works *inside* <SessionProvider>.
function RootNavigator() {
  const { session, isLoading } = useSession();

  // Until the stored session is read we don't know which screens to allow.
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isSignedIn = session !== null;

  // Stack.Protected hides screens whose guard is false; when the session changes,
  // Expo Router moves the user to a screen that is allowed.
  return (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen
          name="index"
          options={{ title: "Who's at uni", headerRight: () => <SignOutButton /> }}
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
    backgroundColor: "#ffffff",
  },
});
