import { ActivityIndicator } from "react-native";

import { useTheme } from "../providers/ThemeProvider";

export function Spinner({ label = "Cargando..." }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <ActivityIndicator
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      color={colors.primary}
    />
  );
}