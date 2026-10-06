import { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Appointments: undefined;
  Emergency: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  HospitalDetails: { hospitalId: string };
  DoctorProfile: { hospitalId: string; doctorId: string };
  AppointmentBooking: { hospitalId: string; doctorId: string; doctorName: string };
  AmbulanceRequest: undefined;
  AmbulanceTracking: { requestId: string };
};
