import { useEffect } from "react";
import { View, Text, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../hooks/useAuth";
import { useMyAmbulance, useUpdateDriverStatus } from "../hooks/useDriverStatus";
import { useActiveTrip } from "../hooks/useActiveTrip";
import { useIncomingRequest } from "../hooks/useIncomingRequest";
import { useLocationBroadcast } from "../hooks/useLocationBroadcast";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { data: ambulanceData, isLoading } = useMyAmbulance();
  const updateStatus = useUpdateDriverStatus();
  const activeTrip = useActiveTrip();

  const ambulance = ambulanceData?.ambulance;
  const isAvailable = ambulance?.status === "AVAILABLE";
  const isOnTrip = ambulance?.status === "ON_TRIP";

  useLocationBroadcast(isAvailable);

  const { incoming } = useIncomingRequest(isAvailable);

  useEffect(() => {
    if (incoming) {
      navigation.navigate("IncomingRequest", { requestId: incoming.id });
    }
  }, [incoming, navigation]);

  // Resuming after a restart/re-login while a request is already sitting on this ambulance —
  // covers the case the live incoming-request push (below) can't: it only fires for a request
  // that arrives while the app is already open. A REQUESTED-but-not-yet-accepted request routes
  // back to IncomingRequest (Accept/Decline still needed); anything past that resumes ActiveTrip.
  useEffect(() => {
    const activeRequest = isOnTrip ? activeTrip.data?.request : undefined;
    if (!activeRequest) return;
    if (activeRequest.status === "REQUESTED") {
      navigation.navigate("IncomingRequest", { requestId: activeRequest.id });
    } else {
      navigation.navigate("ActiveTrip", { requestId: activeRequest.id });
    }
  }, [isOnTrip, activeTrip.data, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={styles.loading} color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{user?.name}</Text>
          <Text style={styles.vehicle}>{ambulance?.vehicleNumber ?? "No vehicle assigned"}</Text>
        </View>
        <Button label="Log out" variant="secondary" onPress={logout} style={styles.logoutButton} />
      </View>

      <View style={styles.center}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{isAvailable ? "ON SHIFT" : "OFF SHIFT"}</Text>
          <Switch
            value={isAvailable}
            onValueChange={(next) => updateStatus.mutate(next ? "AVAILABLE" : "OFFLINE")}
            disabled={updateStatus.isPending || !ambulance}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor={colors.white}
          />
        </View>
        <Text style={styles.hint}>
          {isAvailable ? "Waiting for a request…" : "Go on shift to start receiving requests."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  loading: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  greeting: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.white,
  },
  vehicle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.brand,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  statusLabel: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: 1,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.white,
    opacity: 0.7,
    marginTop: 20,
    textAlign: "center",
  },
});
