import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "../hooks/useLocation";
import { useNearbyHospitals } from "../hooks/useNearbyHospitals";
import { SearchBar } from "../components/SearchBar";
import { EmergencyButton } from "../components/EmergencyButton";
import { QuickAction } from "../components/QuickAction";
import { HospitalCard } from "../components/HospitalCard";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const nearby = useNearbyHospitals(location.latitude, location.longitude, debouncedQuery || undefined);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={nearby.data?.hospitals ?? []}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <HospitalCard hospital={item} onPress={() => navigation.navigate("HospitalDetails", { hospitalId: item.id })} />
        )}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Text style={styles.location}>
              {location.isLoading
                ? "Locating you..."
                : location.isDefault
                  ? "● Using default location (Bengaluru)"
                  : "● Current location"}
            </Text>

            <View style={styles.searchWrap}>
              <SearchBar value={query} onChangeText={setQuery} />
            </View>

            <EmergencyButton onPress={() => navigation.navigate("Main", { screen: "Emergency" })} />

            <View style={styles.quickActions}>
              <QuickAction label="Hospitals" onPress={() => navigation.navigate("Main", { screen: "Map" })} />
              <QuickAction
                label="Doctors"
                muted
                onPress={() => Alert.alert("Coming soon", "Doctor search arrives in a later phase.")}
              />
              <QuickAction label="Ambulance" onPress={() => navigation.navigate("AmbulanceRequest")} />
            </View>

            <Text style={styles.sectionTitle}>Nearby hospitals</Text>
            <Text style={styles.sectionHint}>
              Ranked by a convenience match score (distance, beds, emergency status) — not medical advice.
            </Text>
          </View>
        }
        ListEmptyComponent={
          nearby.isLoading ? (
            <Text style={styles.empty}>Loading nearby hospitals...</Text>
          ) : (
            <Text style={styles.empty}>No hospitals found nearby.</Text>
          )
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
  greeting: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.navy,
    marginTop: 8,
  },
  location: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.brandLight,
    marginTop: 4,
    marginBottom: 20,
  },
  searchWrap: {
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.textMuted,
    marginBottom: 12,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
});
