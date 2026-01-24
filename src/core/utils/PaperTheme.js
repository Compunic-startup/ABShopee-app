import { DefaultTheme } from "react-native-paper";
import { COLORS } from "./color";
import FONTS  from "./fonts";

export const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.secondary,
    background: COLORS.background,
    text: COLORS.text,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: FONTS.Regular,
    medium: FONTS.Bold,
    light: FONTS.Light,
    thin: FONTS.Thin,
  },
};
