import { StyleSheet, Text, View } from "react-native";

import { shape, spacing } from "../../lib/generated/tokens";
import { useTheme } from "../providers/ThemeProvider";
import { typeStyle } from "../../lib/ui-styles";

export interface StepperProps {
  current: number;
  total: number;
  titles: string[];
  progressLabel: string;
  announce: string;
}

export function Stepper({ current, total, titles, progressLabel, announce }: StepperProps) {
  const { colors } = useTheme();
  const cappedTotal = total > 0 ? total : 1;
  const percentage = Math.min(100, Math.max(0, (current / cappedTotal) * 100));

  return (
    <View style={styles.root}>
      <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>{progressLabel}</Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={progressLabel}
        accessibilityValue={{ min: 1, max: total, now: current }}
        style={[styles.track, { backgroundColor: colors.surfaceContainerHigh }]}
      >
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.primary, width: `${percentage}%` as `${number}%` },
          ]}
        />
      </View>
      <View style={styles.titles}>
        {titles.map((title, index) => {
          const active = index + 1 === current;
          return (
            <Text
              key={title}
              accessibilityState={{ selected: active }}
              style={[
                typeStyle("bodySmall"),
                { color: active ? colors.primary : colors.onSurfaceVariant, fontWeight: active ? "600" : "400" },
              ]}
            >
              {title}
            </Text>
          );
        })}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.announce}>
        {announce}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
  track: {
    height: spacing[2],
    borderRadius: shape.full,
    overflow: "hidden",
  },
  fill: {
    height: spacing[2],
    borderRadius: shape.full,
  },
  titles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  announce: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});
