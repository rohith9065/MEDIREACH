import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useActiveTrip, useActiveTripUpdates, useUpdateRequestStatus } from "../hooks/useActiveTrip";
import { useLocationBroadcast } from "../hooks/useLocationBroadcast";
import { MapView } from "../components/MapView";
import { Button } from "../components/Button";
import { AMBULANCE_REQUEST_TRANSITIONS } from "../../../../shared/constants/ambulance";
import { AmbulanceRequestStatus } from "../../../../shared/types/ambulance";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "ActiveTrip">;

const STATUS_LABEL: Record<AmbulanceRequestStatus, string> = {
  REQUESTED: "Assigned",
  ACCEPTED: "Accepted",
  GOING_TO_PATIENT: "Going to patient",
  ARRIVED_AT_PATIENT: "Arrived at patient",
  GOING_TO_HOSPITAL: "Going to hospital",
  ARRIVED_AT_HOSPITAL: "Arrived at hospital",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  GOING_TO_PATIENT: "Start driving to patient",
  ARRIVED_AT_PATIENT: "Mark arrived at patient",
  GOING_TO_HOSPITAL: "Start driving to hospital",
  ARRIVED_AT_HOSPITAL: "Mark arrived at hospital",
  COMPLETED: "Complete trip",
};

export function ActiveTripScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const { data, isLoading } = useActiveTrip();
  const updateStatus = useUpdateRequestStatus();
  useActiveTripUpdates(requestId);
  const selfPosition = useLocationBroadcast(true);

  const request = data?.request;

  useEffect(() => {
    if (request?.status === "COMPLETED" || request?.status === "CANCELLED") {
      const timer = setTimeout(() => navigation.replace("Home"), 2000);
      return () => clearTimeout(timer);
    }
  }, [request?.status, navigation]);

  if (isLoading || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={styles.loading} color={colors.brand} />
      </SafeAreaView>
    );
  }

  const nextStatus = AMBULANCE_REQUEST_TRANSITIONS[request.status] as AmbulanceRequestStatus | undefined;

  function handleAdvance() {
    if (!nextStatus) return;
    updateStatus.mutate({ requestId, status: nextStatus });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.mapWrap}>
        <MapView pickup={{ latitude: request.pickupLatitude, longitude: request.pickupLongitude }} selfPosition={selfPosition} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.statusLabel}>{STATUS_LABEL[request.status]}</Text>

        {nextStatus ? (
          <Button
            label={updateStatus.isPending ? "Updating…" : NEXT_ACTION_LABEL[nextStatus]}
            variant="primary"
            onPress={handleAdvance}
            disabled={updateStatus.isPending}
            style={styles.actionButton}
          />
        ) : (
          <Text style={styles.doneHint}>Returning to shift status…</Text>
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
    flex: 1,
  },
  mapWrap: {
    flex: 1,
  },
  panel: {
    padding: 20,
    backgroundColor: colors.ink,
  },
  statusLabel: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.white,
    marginBottom: 14,
  },
  actionButton: {
    width: "100%",
  },
  doneHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.white,
    opacity: 0.7,
  },
});
