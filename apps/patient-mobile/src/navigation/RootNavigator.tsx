import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../hooks/useAuth";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { EmergencyScreen } from "../screens/EmergencyScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { HospitalDetailsScreen } from "../screens/HospitalDetailsScreen";
import { DoctorProfileScreen } from "../screens/DoctorProfileScreen";
import { AppointmentBookingScreen } from "../screens/AppointmentBookingScreen";
import { MyAppointmentsScreen } from "../screens/MyAppointmentsScreen";
import { AmbulanceRequestScreen } from "../screens/AmbulanceRequestScreen";
import { AmbulanceTrackingScreen } from "../screens/AmbulanceTrackingScreen";
import { RootStackParamList, MainTabParamList } from "./types";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Appointments" component={MyAppointmentsScreen} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="HospitalDetails"
              component={HospitalDetailsScreen}
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="DoctorProfile"
              component={DoctorProfileScreen}
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="AppointmentBooking"
              component={AppointmentBookingScreen}
              options={{ headerShown: true, title: "Book Appointment" }}
            />
            <Stack.Screen
              name="AmbulanceRequest"
              component={AmbulanceRequestScreen}
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="AmbulanceTracking"
              component={AmbulanceTrackingScreen}
              options={{ headerShown: true, title: "Ambulance", gestureEnabled: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
