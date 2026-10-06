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

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, phone || undefined);
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
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Patient accounts only — hospital staff are provisioned separately.</Text>

          <View style={styles.form}>
            <TextField label="Full name" value={name} onChangeText={setName} />
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField label="Phone (optional)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              label={submitting ? "Creating account..." : "Create account"}
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>

          <Pressable onPress={() => navigation.navigate("Login")} style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerLink}>Sign in</Text>
            </Text>
          </Pressable>
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
    paddingVertical: 40,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 28,
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
});
