import { SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk";
import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold } from "@expo-google-fonts/manrope";

export const fonts = {
  display: "SpaceGrotesk_700Bold",
  displaySemiBold: "SpaceGrotesk_600SemiBold",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodyBold: "Manrope_700Bold",
} as const;

export const fontsToLoad = {
  SpaceGrotesk_700Bold,
  SpaceGrotesk_600SemiBold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
};
