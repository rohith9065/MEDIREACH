import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useActiveTrip, useAcceptRequest, useDeclineRequest } from "../hooks/useActiveTrip";
import { Button } from "../components/Button";
import { ApiError } from "../services/apiClient";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "IncomingRequest">;

export function IncomingRequestScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const { data, isLoading } = useActiveTrip();
  const acceptRequest = useAcceptRequest();
  const declineRequest = useDeclineRequest();

  const request = data?.request;

  async function handleAccept() {
    try {
      await acceptRequest.mutateAsync(requestId);
      navigation.replace("ActiveTrip", { requestId });
    } catch (err) {
      Alert.alert("Couldn't accept", err instanceof ApiError ? err.message : "Please try again.");
      navigation.replace("Home");
    }
  }

  async function handleDecline() {
    try {
      await declineRequest.mutateAsync(requestId);
    } catch {
      // Best-effort — either way the driver is done with this request.
    }
    navigation.replace("Home");
  }

  if (isLoading || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={styles.loading} color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.badge}>NEW REQUEST</Text>
        <Text style={styles.title}>Pickup needed</Text>
        <Text style={styles.coords}>
          {request.pickupLatitude.toFixed(4)}, {request.pickupLongitude.toFixed(4)}
        </Text>

        <View style={styles.actions}>
          <Button
            label={declineRequest.isPending ? "Declining…" : "Decline"}
            variant="secondary"
            onPress={handleDecline}
            disabled={acceptRequest.isPending || declineRequest.isPending}
            style={styles.actionButton}
          />
          <Button
            label={acceptRequest.isPending ? "Accepting…" : "Accept"}
            variant="primary"
            onPress={handleAccept}
            disabled={acceptRequest.isPending || declineRequest.isPending}
            style={styles.actionButton}
          />
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  badge: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.brand,
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.white,
    textAlign: "center",
  },
  coords: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.white,
    opacity: 0.6,
    marginTop: 8,
    marginBottom: 40,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
  },
});
