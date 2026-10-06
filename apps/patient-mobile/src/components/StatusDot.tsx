import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type StatusKind = "available" | "limited" | "unavailable" | "unknown";

const COLOR_MAP: Record<StatusKind, string> = {
  available: colors.statusAvailable,
  limited: colors.statusLimited,
  unavailable: colors.statusUnavailable,
  unknown: colors.statusUnknown,
};

export function statusKind(value: string): StatusKind {
  switch (value) {
    case "AVAILABLE":
      return "available";
    case "LIMITED":
      return "limited";
    case "UNAVAILABLE":
      return "unavailable";
    default:
      return "unknown";
  }
}

export function StatusDot({ kind, label }: { kind: StatusKind; label: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: COLOR_MAP[kind] }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.navy,
  },
});
