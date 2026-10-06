import { useEffect } from "react";
import { View, Text, StyleSheet, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAmbulanceRequestDetail, useCancelAmbulanceRequest } from "../hooks/useActiveAmbulanceRequest";
import { useAmbulanceRequestUpdates } from "../hooks/useAmbulanceRequestUpdates";
import { MapView } from "../components/MapView";
import { Button } from "../components/Button";
import { AmbulanceRequestStatus } from "../../../../shared/types/ambulance";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "AmbulanceTracking">;

const STATUS_LABEL: Record<AmbulanceRequestStatus, string> = {
  REQUESTED: "Finding your ambulance…",
  ACCEPTED: "Ambulance assigned",
  GOING_TO_PATIENT: "On the way to you",
  ARRIVED_AT_PATIENT: "Ambulance has arrived",
  GOING_TO_HOSPITAL: "On the way to hospital",
  ARRIVED_AT_HOSPITAL: "Arrived at hospital",
  COMPLETED: "Trip complete",
  CANCELLED: "Request cancelled",
};

const NON_TERMINAL: AmbulanceRequestStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "GOING_TO_PATIENT",
  "ARRIVED_AT_PATIENT",
  "GOING_TO_HOSPITAL",
  "ARRIVED_AT_HOSPITAL",
];

export function AmbulanceTrackingScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const { data, isLoading } = useAmbulanceRequestDetail(requestId);
  const cancelRequest = useCancelAmbulanceRequest();
  useAmbulanceRequestUpdates(requestId);

  const request = data?.request;

  useEffect(() => {
    if (request?.status === "COMPLETED" || request?.status === "CANCELLED") {
      const timer = setTimeout(() => navigation.replace("Main", { screen: "Home" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [request?.status, navigation]);

  function handleCancel() {
    Alert.alert("Cancel request", "Cancel this ambulance request?", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel request",
        style: "destructive",
        onPress: () => cancelRequest.mutate(requestId),
      },
    ]);
  }

  function callDriver() {
    if (request?.driverPhone) {
      Linking.openURL(`tel:${request.driverPhone}`).catch(() => {});
    }
  }

  if (isLoading || !request) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const isCancellable = NON_TERMINAL.includes(request.status);
  const hasDriver = !!request.driverName;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.mapWrap}>
        <MapView
          hospitals={[]}
          userLocation={{ latitude: request.pickupLatitude, longitude: request.pickupLongitude }}
          ambulanceLocation={
            request.ambulanceLatitude != null && request.ambulanceLongitude != null
              ? { latitude: request.ambulanceLatitude, longitude: request.ambulanceLongitude }
              : null
          }
          onMarkerPress={() => {}}
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.statusLabel}>{STATUS_LABEL[request.status]}</Text>

        {hasDriver && (
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{request.driverName}</Text>
              <Text style={styles.vehicleNumber}>{request.vehicleNumber}</Text>
            </View>
            {request.driverPhone && (
              <Button label="Call" variant="dark" onPress={callDriver} style={styles.callButton} />
            )}
          </View>
        )}

        {isCancellable && (
          <Button
            label={cancelRequest.isPending ? "Cancelling…" : "Cancel request"}
            variant="secondary"
            onPress={handleCancel}
            disabled={cancelRequest.isPending}
            style={styles.cancelButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  mapWrap: {
    flex: 1,
  },
  panel: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusLabel: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.navy,
    marginBottom: 12,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.fieldFill,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.navy,
  },
  vehicleNumber: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  callButton: {
    paddingHorizontal: 20,
  },
  cancelButton: {
    marginTop: 4,
  },
});
