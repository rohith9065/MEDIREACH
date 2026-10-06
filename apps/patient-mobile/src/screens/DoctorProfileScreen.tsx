import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useHospitalDetail } from "../hooks/useHospitalDetail";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "DoctorProfile">;

export function DoctorProfileScreen({ route, navigation }: Props) {
  const { hospitalId, doctorId } = route.params;
  const { data, isLoading, isError } = useHospitalDetail(hospitalId);
  const hospital = data?.hospital;
  const doctor = hospital?.doctors.find((d) => d.id === doctorId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ActivityIndicator style={styles.loading} color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (isError || !hospital || !doctor) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <Text style={styles.errorText}>Couldn't load this doctor.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{doctor.name}</Text>
        {doctor.specialization && <Text style={styles.specialization}>{doctor.specialization}</Text>}
        <Text style={styles.hospitalName}>{hospital.name}</Text>
        {doctor.departmentName && <Text style={styles.muted}>{doctor.departmentName} department</Text>}

        <View style={styles.statusBlock}>
          <StatusDot kind={statusKind(doctor.status)} label={doctor.status} />
        </View>

        <Button
          label="Book appointment"
          onPress={() =>
            navigation.navigate("AppointmentBooking", { hospitalId, doctorId, doctorName: doctor.name })
          }
          style={styles.bookButton}
        />

        <Text style={styles.disclaimer}>
          Slots are generated from the doctor's schedule set by hospital staff and can change. Booking
          confirms a queue token, not a guaranteed exact time.
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
  loading: {
    marginTop: 40,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.statusUnavailable,
    textAlign: "center",
    marginTop: 40,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.navy,
  },
  specialization: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.brand,
    marginTop: 4,
  },
  hospitalName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBlock: {
    marginTop: 14,
  },
  bookButton: {
    marginTop: 24,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 16,
    lineHeight: 16,
  },
});
