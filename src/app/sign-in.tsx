import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { signIn, signUp } from "@/features/auth/auth-api";
import {
  MAX_DISPLAY_NAME_LENGTH,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from "@/features/auth/validation";

type Mode = "sign-in" | "sign-up";

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";

  function switchMode() {
    setMode(isSignUp ? "sign-in" : "sign-up");
    setError(null);
  }

  async function handleSubmit() {
    // `??` picks the first message that isn't null, i.e. the first problem found.
    const inputError =
      validateEmail(email) ??
      validatePassword(password) ??
      (isSignUp ? validateDisplayName(displayName) : null);
    if (inputError !== null) {
      setError(inputError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      // No navigation needed: the root layout switches screens once the session exists.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // keyboardShouldPersistTaps: the button works on the first tap even while the keyboard is open.
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isSignUp ? "Create your account" : "Welcome back"}</Text>
      <Text style={styles.subtitle}>See which of your friends are at TUHH right now.</Text>

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Your name (shown to your friends)"
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          maxLength={MAX_DISPLAY_NAME_LENGTH}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={isSignUp ? "new-password" : "current-password"}
      />

      {error !== null && <Text style={styles.error}>{error}</Text>}

      <View style={styles.submit}>
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Button title={isSignUp ? "Create account" : "Sign in"} onPress={handleSubmit} />
        )}
      </View>

      <Pressable onPress={switchMode} disabled={isSubmitting} style={styles.switchMode}>
        <Text style={styles.link}>
          {isSignUp ? "Already have an account? Sign in" : "No account yet? Create one"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
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
    textAlign: "center",
  },
  submit: {
    marginTop: 4,
    minHeight: 40,
    justifyContent: "center",
  },
  switchMode: {
    marginTop: 20,
    padding: 8,
  },
  link: {
    color: "#1a73e8",
    textAlign: "center",
  },
});
