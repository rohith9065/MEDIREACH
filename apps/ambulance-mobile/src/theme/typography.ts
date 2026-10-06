import { BarlowCondensed_700Bold, BarlowCondensed_600SemiBold } from "@expo-google-fonts/barlow-condensed";
import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold } from "@expo-google-fonts/manrope";

export const fonts = {
  display: "BarlowCondensed_700Bold",
  displaySemiBold: "BarlowCondensed_600SemiBold",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodyBold: "Manrope_700Bold",
} as const;

export const fontsToLoad = {
  BarlowCondensed_700Bold,
  BarlowCondensed_600SemiBold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
};
