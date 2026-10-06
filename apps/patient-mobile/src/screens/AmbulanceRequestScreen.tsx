import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useLocation } from "../hooks/useLocation";
import { useNearbyHospitals } from "../hooks/useNearbyHospitals";
import { useRequestAmbulance } from "../hooks/useRequestAmbulance";
import { Button } from "../components/Button";
import { ApiError } from "../services/apiClient";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "AmbulanceRequest">;

export function AmbulanceRequestScreen({ navigation }: Props) {
  const location = useLocation();
  const nearby = useNearbyHospitals(location.latitude, location.longitude, undefined, undefined, undefined, true);
  const requestAmbulance = useRequestAmbulance();
  const [destinationHospitalId, setDestinationHospitalId] = useState<string | null>(null);

  const hospitals = nearby.data?.hospitals ?? [];

  async function handleRequest() {
    try {
      const res = await requestAmbulance.mutateAsync({
        pickupLatitude: location.latitude,
        pickupLongitude: location.longitude,
        destinationHospitalId: destinationHospitalId ?? undefined,
      });
      navigation.replace("AmbulanceTracking", { requestId: res.request.id });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the server. Check your connection and try again.";
      Alert.alert("Couldn't request an ambulance", message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Request an Ambulance</Text>
        <Text style={styles.subtitle}>
          {location.isLoading
            ? "Locating you…"
            : location.isDefault
              ? "Using default location — enable GPS for an accurate pickup point"
              : "Pickup: your current location"}
        </Text>

        <Text style={styles.sectionTitle}>Destination hospital (optional)</Text>
        <Text style={styles.sectionHint}>The nearest available ambulance will be dispatched either way.</Text>
        <View style={styles.hospitalList}>
          {hospitals.slice(0, 5).map((h) => {
            const active = h.id === destinationHospitalId;
            return (
              <Pressable
                key={h.id}
                onPress={() => setDestinationHospitalId(active ? null : h.id)}
                style={[styles.hospitalChip, active && styles.hospitalChipActive]}
              >
                <Text style={[styles.hospitalChipLabel, active && styles.hospitalChipLabelActive]} numberOfLines={1}>
                  {h.name}
                </Text>
                <Text style={[styles.hospitalChipMeta, active && styles.hospitalChipLabelActive]}>
                  {h.distanceKm} km
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={requestAmbulance.isPending ? "Requesting…" : "Request Ambulance"}
          variant="primary"
          onPress={handleRequest}
          disabled={requestAmbulance.isPending || location.isLoading}
          loading={requestAmbulance.isPending}
          style={styles.requestButton}
        />

        <Text style={styles.disclaimer}>
          This dispatches the nearest available ambulance registered with MediReach — not a certified
          emergency-response system. In a life-threatening emergency, also call your local emergency services.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.navy,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
  },
  hospitalList: {
    marginBottom: 28,
  },
  hospitalChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  hospitalChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  hospitalChipLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.navy,
  },
  hospitalChipMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  hospitalChipLabelActive: {
    color: colors.white,
  },
  requestButton: {
    marginTop: 8,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 16,
    lineHeight: 16,
  },
});
