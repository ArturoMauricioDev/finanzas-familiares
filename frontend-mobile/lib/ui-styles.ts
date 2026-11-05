import type { TextStyle, ViewStyle } from "react-native";

import {
  elevation,
  typography,
  type TypographyName,
} from "./generated/tokens";

export function typeStyle(name: TypographyName): TextStyle {
  const value = typography[name];
  return {
    fontSize: value.fontSize,
    lineHeight: value.lineHeight,
    fontWeight: value.fontWeight as TextStyle["fontWeight"],
    letterSpacing: value.letterSpacing,
  };
}

export function elevationStyle(level: "0" | "1" | "2" | "3" = "1"): ViewStyle {
  const value = elevation[level];
  return {
    shadowColor: value.shadowColor,
    shadowOpacity: value.shadowOpacity,
    shadowRadius: value.shadowRadius,
    shadowOffset: value.shadowOffset,
    elevation: value.elevation,
  };
}
