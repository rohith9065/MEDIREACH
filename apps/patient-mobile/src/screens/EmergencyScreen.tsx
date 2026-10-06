import { View, Text, StyleSheet, FlatList, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useLocation } from "../hooks/useLocation";
import { useNearbyHospitals } from "../hooks/useNearbyHospitals";
import { NearbyHospitalSummary } from "../../../../shared/types/publicHospital";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

// India's national emergency ambulance number — hardcoded pending localization support.
const EMERGENCY_SERVICES_NUMBER = "108";

function callHospital(hospital: NearbyHospitalSummary) {
  const number = hospital.emergencyPhone ?? hospital.phone;
  if (number) {
    Linking.openURL(`tel:${number}`).catch(() => {});
  }
}

function callEmergencyServices() {
  Linking.openURL(`tel:${EMERGENCY_SERVICES_NUMBER}`).catch(() => {});
}

function openNavigation(hospital: NearbyHospitalSummary) {
  const label = encodeURIComponent(hospital.name);
  const url = Platform.select({
    ios: `https://maps.apple.com/?daddr=${hospital.latitude},${hospital.longitude}&q=${label}`,
    default: `geo:${hospital.latitude},${hospital.longitude}?q=${hospital.latitude},${hospital.longitude}(${label})`,
  });
  Linking.openURL(url).catch(() => {});
}

export function EmergencyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const location = useLocation();
  const nearby = useNearbyHospitals(location.latitude, location.longitude, undefined, undefined, undefined, true);

  const hospitals = nearby.data?.hospitals ?? [];
  const [top, ...rest] = hospitals;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={rest}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Emergency</Text>
            <Text style={styles.disclaimer}>
              Ranked by emergency readiness, then distance. This does not replace calling your local
              emergency services in a real emergency.
            </Text>

            <Button
              label={`Call Emergency Services (${EMERGENCY_SERVICES_NUMBER})`}
              variant="dark"
              onPress={callEmergencyServices}
              style={styles.sosButton}
            />

            <Button
              label="Request Ambulance"
              variant="primary"
              onPress={() => navigation.navigate("AmbulanceRequest")}
              style={styles.sosButton}
            />

            {top && (
              <View style={styles.heroCard}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeLabel}>RECOMMENDED</Text>
                </View>
                <Text style={styles.heroName}>{top.name}</Text>
                <Text style={styles.heroMeta}>
                  {top.distanceKm} km · {top.etaMinutes} min
                </Text>
                <View style={styles.statusRow}>
                  <StatusDot
                    kind={statusKind(top.emergencyStatus)}
                    label={`Emergency ${top.emergencyStatus.toLowerCase()}`}
                  />
                </View>
                <View style={styles.actions}>
                  <Button
                    label="Call"
                    variant="primary"
                    onPress={() => callHospital(top)}
                    style={styles.actionButton}
                  />
                  <Button
                    label="Navigate"
                    variant="dark"
                    onPress={() => openNavigation(top)}
                    style={styles.actionButton}
                  />
                </View>
                <Text
                  style={styles.detailsLink}
                  onPress={() => navigation.navigate("HospitalDetails", { hospitalId: top.id })}
                >
                  View details →
                </Text>
              </View>
            )}

            {rest.length > 0 && <Text style={styles.sectionTitle}>Other nearby options</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.distanceKm} km · {item.etaMinutes} min
            </Text>
            <View style={styles.statusRow}>
              <StatusDot kind={statusKind(item.emergencyStatus)} label={`Emergency ${item.emergencyStatus.toLowerCase()}`} />
            </View>
            <View style={styles.actions}>
              <Button
                label="Call"
                variant="secondary"
                onPress={() => callHospital(item)}
                style={styles.actionButton}
              />
              <Button label="Navigate" variant="dark" onPress={() => openNavigation(item)} style={styles.actionButton} />
            </View>
            <Text
              style={styles.detailsLink}
              onPress={() => navigation.navigate("HospitalDetails", { hospitalId: item.id })}
            >
              View details →
            </Text>
          </View>
        )}
        ListEmptyComponent={
          hospitals.length === 0 ? (
            <Text style={styles.empty}>
              {nearby.isLoading ? "Loading..." : "No hospitals nearby are currently reporting emergency availability."}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.statusUnavailable,
    marginTop: 8,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 17,
  },
  sosButton: {
    marginBottom: 20,
  },
  heroCard: {
    borderWidth: 2,
    borderColor: colors.brand,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    backgroundColor: colors.white,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroBadgeLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 0.5,
  },
  heroName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.navy,
  },
  heroMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  hospitalName: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    color: colors.navy,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  statusRow: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  detailsLink: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.brand,
    marginTop: 12,
    textAlign: "center",
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
});
