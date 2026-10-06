import { View, Text, StyleSheet, ScrollView, Linking, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useHospitalDetail } from "../hooks/useHospitalDetail";
import { useHospitalLiveUpdates } from "../hooks/useHospitalLiveUpdates";
import { StatusDot, statusKind } from "../components/StatusDot";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "HospitalDetails">;

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function HospitalDetailsScreen({ route, navigation }: Props) {
  const { hospitalId } = route.params;
  const { data, isLoading, isError } = useHospitalDetail(hospitalId);
  useHospitalLiveUpdates(hospitalId);
  const hospital = data?.hospital;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ActivityIndicator style={styles.loading} color={colors.brand} />
      </SafeAreaView>
    );
  }

  if (isError || !hospital) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <Text style={styles.errorText}>Couldn't load this hospital.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{hospital.name}</Text>
        {hospital.address && <Text style={styles.address}>{hospital.address}</Text>}

        <View style={styles.statusBlock}>
          <StatusDot kind={statusKind(hospital.emergencyStatus)} label={`Emergency ${hospital.emergencyStatus.toLowerCase()}`} />
        </View>

        {hospital.phone && (
          <Button
            label="Call hospital"
            variant="dark"
            onPress={() => Linking.openURL(`tel:${hospital.phone}`)}
            style={styles.callButton}
          />
        )}

        <Text style={styles.sectionTitle}>Beds</Text>
        <View style={styles.table}>
          {hospital.beds.length === 0 && <Text style={styles.muted}>No bed data reported yet.</Text>}
          {hospital.beds.map((bed) => (
            <View key={bed.bedType} style={styles.tableRow}>
              <Text style={styles.tableLabel}>{bed.bedType}</Text>
              <StatusDot
                kind={bed.available > 0 ? "available" : "unavailable"}
                label={`${bed.available} available of ${bed.total}`}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.table}>
          {hospital.facilities.length === 0 && <Text style={styles.muted}>No facility data reported yet.</Text>}
          {hospital.facilities.map((f) => (
            <View key={f.facilityName} style={styles.tableRow}>
              <Text style={styles.tableLabel}>{f.facilityName.replace(/_/g, " ")}</Text>
              <StatusDot kind={statusKind(f.status)} label={f.status} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Doctors</Text>
        <View style={styles.table}>
          {hospital.doctors.length === 0 && <Text style={styles.muted}>No doctors listed yet.</Text>}
          {hospital.doctors.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => navigation.navigate("DoctorProfile", { hospitalId, doctorId: doc.id })}
              style={({ pressed }) => [styles.tableRow, pressed && styles.tableRowPressed]}
            >
              <View>
                <Text style={styles.tableLabel}>{doc.name}</Text>
                {doc.specialization && <Text style={styles.muted}>{doc.specialization}</Text>}
              </View>
              <StatusDot kind={statusKind(doc.status)} label={doc.status} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.updated}>Updated {timeAgo(hospital.dataUpdatedAt)}</Text>
        <Text style={styles.disclaimer}>
          Availability is entered by hospital staff and can change quickly. It is not a guarantee of
          admission — in a real emergency, contact your local emergency services.
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
  address: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  statusBlock: {
    marginTop: 14,
  },
  callButton: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    color: colors.navy,
    marginTop: 24,
    marginBottom: 10,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowPressed: {
    opacity: 0.6,
  },
  tableLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.navy,
  },
  muted: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  updated: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 24,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 16,
  },
});
