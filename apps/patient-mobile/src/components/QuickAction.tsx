import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

// `muted` is visual-only (grayed out to signal "not fully built yet") — the button stays
// tappable so onPress can still show a "coming soon" message. A truly `disabled` Pressable
// swallows the tap entirely, which left taps on Doctors/Ambulance looking like dead buttons.
export function QuickAction({ label, onPress, muted }: { label: string; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.circle, muted && styles.muted, pressed && styles.pressed]}
    >
      <Text style={[styles.label, muted && styles.labelMuted]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  muted: {
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.white,
    textAlign: "center",
  },
  labelMuted: {
    color: colors.textMuted,
  },
});
