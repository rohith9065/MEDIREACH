import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { useBookAppointment } from "../hooks/useBookAppointment";
import { Button } from "../components/Button";
import { ApiError } from "../services/apiClient";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "AppointmentBooking">;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextDays(count: number): { iso: string; label: string; weekday: string }[] {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      iso: isoDate(d),
      label: String(d.getDate()),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return days;
}

export function AppointmentBookingScreen({ route, navigation }: Props) {
  const { hospitalId, doctorId, doctorName } = route.params;
  const days = useMemo(() => nextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(days[0].iso);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data, isLoading } = useAvailableSlots(hospitalId, doctorId, selectedDate);
  const bookAppointment = useBookAppointment();
  const slots = data?.slots ?? [];

  function handleSelectDate(iso: string) {
    setSelectedDate(iso);
    setSelectedTime(null);
  }

  async function handleConfirm() {
    if (!selectedTime) return;
    try {
      const res = await bookAppointment.mutateAsync({
        hospitalId,
        doctorId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
      });
      Alert.alert("Appointment booked", `Your token number is #${res.appointment.tokenNumber}.`, [
        { text: "OK", onPress: () => navigation.navigate("Main", { screen: "Appointments" }) },
      ]);
    } catch (err) {
      Alert.alert("Couldn't book appointment", err instanceof ApiError ? err.message : "Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.doctorName}>{doctorName}</Text>
        <Text style={styles.hint}>Choose a date and time slot</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
          {days.map((day) => {
            const active = day.iso === selectedDate;
            return (
              <Pressable
                key={day.iso}
                onPress={() => handleSelectDate(day.iso)}
                style={[styles.dateChip, active && styles.dateChipActive]}
              >
                <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>{day.weekday}</Text>
                <Text style={[styles.dateLabel, active && styles.dateTextActive]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Available slots</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.brand} style={styles.loading} />
        ) : slots.length === 0 ? (
          <Text style={styles.muted}>
            No open slots on this date — try another day. If every date is empty, this doctor's hospital hasn't
            set their weekly availability yet.
          </Text>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((slot) => {
              const active = slot.time === selectedTime;
              return (
                <Pressable
                  key={slot.time}
                  onPress={() => setSelectedTime(slot.time)}
                  style={[styles.slot, active && styles.slotActive]}
                >
                  <Text style={[styles.slotLabel, active && styles.slotLabelActive]}>{slot.time}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Button
          label={bookAppointment.isPending ? "Booking..." : "Confirm booking"}
          onPress={handleConfirm}
          disabled={!selectedTime || bookAppointment.isPending}
          loading={bookAppointment.isPending}
          style={styles.confirmButton}
        />
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
  doctorName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.navy,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  dateRow: {
    flexGrow: 0,
  },
  dateChip: {
    width: 56,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dateChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  dateWeekday: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  dateLabel: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    color: colors.navy,
    marginTop: 2,
  },
  dateTextActive: {
    color: colors.white,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    color: colors.navy,
    marginTop: 28,
    marginBottom: 12,
  },
  loading: {
    marginTop: 12,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  slotLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.navy,
  },
  slotLabelActive: {
    color: colors.white,
  },
  confirmButton: {
    marginTop: 32,
  },
});
