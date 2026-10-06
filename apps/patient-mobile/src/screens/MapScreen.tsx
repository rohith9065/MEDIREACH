import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useLocation } from "../hooks/useLocation";
import { useNearbyHospitals } from "../hooks/useNearbyHospitals";
import { MapView } from "../components/MapView";
import { colors } from "../theme/colors";

export function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const location = useLocation();
  const nearby = useNearbyHospitals(location.latitude, location.longitude);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <MapView
        hospitals={nearby.data?.hospitals ?? []}
        userLocation={{ latitude: location.latitude, longitude: location.longitude }}
        onMarkerPress={(hospitalId) => navigation.navigate("HospitalDetails", { hospitalId })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
