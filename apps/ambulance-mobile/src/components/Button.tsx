import { Pressable, Text, StyleSheet, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Variant = "primary" | "secondary" | "dark" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = "primary", disabled, loading, style }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "dark" && styles.dark,
        variant === "danger" && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.ink : colors.white} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "secondary" ? styles.labelDark : styles.labelLight,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.brand,
  },
  dark: {
    backgroundColor: colors.ink,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  danger: {
    backgroundColor: colors.statusUnavailable,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  labelLight: {
    color: colors.white,
  },
  labelDark: {
    color: colors.ink,
  },
});
