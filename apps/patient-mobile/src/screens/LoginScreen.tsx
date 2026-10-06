import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
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
          : "Can't reach the server. Check you're on the same Wi-Fi as the computer running it, then fully reload the app.",
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
          <Text style={styles.subtitle}>Find. Decide. Book. Track. Reach.</Text>

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

          <Pressable onPress={() => navigation.navigate("Register")} style={styles.footer}>
            <Text style={styles.footerText}>
              New here? <Text style={styles.footerLink}>Create an account</Text>
            </Text>
          </Pressable>

          <Text style={styles.demoHint}>Demo account: patient@demo.medireach.dev / Passw0rd!</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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
    fontSize: 32,
    color: colors.navy,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 36,
  },
  form: {
    marginBottom: 24,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.statusUnavailable,
    marginBottom: 12,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: fonts.bodyBold,
    color: colors.brand,
  },
  demoHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
});
