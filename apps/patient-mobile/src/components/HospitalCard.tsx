import { View, Text, Pressable, StyleSheet } from "react-native";
import { NearbyHospitalSummary } from "../../../../shared/types/publicHospital";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { StatusDot, statusKind } from "./StatusDot";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function HospitalCard({
  hospital,
  onPress,
}: {
  hospital: NearbyHospitalSummary;
  onPress: () => void;
}) {
  const icu = hospital.beds.find((b) => b.bedType === "ICU");

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {hospital.name}
          </Text>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeLabel}>{hospital.matchScore}% Match</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {hospital.distanceKm} km · {hospital.etaMinutes} min
        </Text>

        <View style={styles.statusRow}>
          <StatusDot kind={statusKind(hospital.emergencyStatus)} label={`Emergency ${hospital.emergencyStatus.toLowerCase()}`} />
        </View>
        {icu && (
          <View style={styles.statusRow}>
            <StatusDot
              kind={icu.available > 0 ? "available" : "unavailable"}
              label={`ICU · ${icu.available} available`}
            />
          </View>
        )}

        {hospital.matchReasons.length > 0 && (
          <Text style={styles.reasons} numberOfLines={1}>
            {hospital.matchReasons.slice(0, 3).join("  ·  ")}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.updated}>Updated {timeAgo(hospital.dataUpdatedAt)}</Text>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonLabel}>VIEW</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  accent: {
    width: 5,
    backgroundColor: colors.brandLight,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    color: colors.navy,
  },
  matchBadge: {
    backgroundColor: colors.brand,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.white,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  statusRow: {
    marginBottom: 4,
  },
  reasons: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  updated: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  viewButton: {
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.white,
  },
});
