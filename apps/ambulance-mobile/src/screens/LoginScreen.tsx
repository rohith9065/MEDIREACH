import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Can't reach the server. Check you're on the same Wi-Fi as the computer running it.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>MediReach</Text>
          <Text style={styles.subtitle}>DRIVER</Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button label={submitting ? "Signing in..." : "Sign in"} onPress={handleSubmit} loading={submitting} />
          </View>

          <Text style={styles.demoHint}>Demo account: driver@demo.medireach.dev / Passw0rd!</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.brand,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
    textAlign: "center",
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 36,
  },
  form: {
    marginBottom: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.statusUnavailable,
    marginBottom: 12,
  },
  demoHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.white,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
  },
});
