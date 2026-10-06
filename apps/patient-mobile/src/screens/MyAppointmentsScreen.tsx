import { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useMyAppointments, useCancelAppointment } from "../hooks/useMyAppointments";
import { useQueueLiveUpdates } from "../hooks/useQueueLiveUpdates";
import { StatusDot } from "../components/StatusDot";
import { Appointment } from "../../../../shared/types/appointment";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type StatusKind = "available" | "limited" | "unavailable" | "unknown";

function appointmentStatusKind(appointment: Appointment): StatusKind {
  if (appointment.status === "CANCELLED") return "unavailable";
  if (appointment.status === "COMPLETED") return "available";
  if (appointment.queueStatus === "CALLED" || appointment.queueStatus === "IN_CONSULTATION") return "limited";
  if (appointment.queueStatus === "SKIPPED") return "unavailable";
  return "unknown";
}

function appointmentStatusLabel(appointment: Appointment): string {
  if (appointment.status === "CANCELLED") return "Cancelled";
  if (appointment.status === "COMPLETED") return "Completed";
  switch (appointment.queueStatus) {
    case "CALLED":
      return "Called — go in now";
    case "IN_CONSULTATION":
      return "In consultation";
    case "SKIPPED":
      return "Skipped";
    default:
      return "Waiting";
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function MyAppointmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, refetch, isFetching } = useMyAppointments();
  const cancelAppointment = useCancelAppointment();

  const appointments = data?.appointments ?? [];
  const activeHospitalIds = useMemo(
    () => appointments.filter((a) => a.status === "BOOKED").map((a) => a.hospitalId),
    [appointments],
  );
  useQueueLiveUpdates(activeHospitalIds);

  function handleCancel(appointment: Appointment) {
    Alert.alert("Cancel appointment", `Cancel your appointment with ${appointment.doctorName}?`, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel appointment",
        style: "destructive",
        onPress: () => cancelAppointment.mutate(appointment.id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.listContent}
        refreshing={isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>My Appointments</Text>
            <Text style={styles.subtitle}>Your booked tokens and live queue status</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("HospitalDetails", { hospitalId: item.hospitalId })}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.doctorName}>{item.doctorName}</Text>
                <Text style={styles.hospitalName}>{item.hospitalName}</Text>
              </View>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenLabel}>#{item.tokenNumber}</Text>
              </View>
            </View>

            <Text style={styles.dateTime}>
              {formatDate(item.appointmentDate)} · {formatTime(item.appointmentTime)}
            </Text>

            <View style={styles.statusRow}>
              <StatusDot kind={appointmentStatusKind(item)} label={appointmentStatusLabel(item)} />
            </View>

            {item.status === "BOOKED" &&
              item.currentServingToken != null &&
              item.patientsAhead != null && (
                <Text style={styles.queueInfo}>
                  Now serving #{item.currentServingToken} · {item.patientsAhead} patient
                  {item.patientsAhead === 1 ? "" : "s"} ahead of you
                </Text>
              )}

            {item.status === "BOOKED" && (
              <Pressable onPress={() => handleCancel(item)} style={styles.cancelButton}>
                <Text style={styles.cancelLabel}>Cancel appointment</Text>
              </Pressable>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading ? "Loading appointments..." : "No appointments yet — book one from a hospital's doctor list."}
          </Text>
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
    color: colors.navy,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardHeaderText: {
    flex: 1,
  },
  doctorName: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    color: colors.navy,
  },
  hospitalName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tokenBadge: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tokenLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  dateTime: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.navy,
    marginTop: 10,
  },
  statusRow: {
    marginTop: 8,
  },
  queueInfo: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.brand,
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  cancelLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.statusUnavailable,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
});
