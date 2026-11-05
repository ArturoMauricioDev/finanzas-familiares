// @ts-nocheck
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export type ChartType = "line" | "bar" | "pie" | "area";

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ChartContainerProps {
  type: ChartType;
  data: Record<string, string | number>[];
  series: ChartSeries[];
  title: string;
  summary: string;
  height?: number;
}

export function ChartContainer({
  data,
  series,
  title,
  summary,
  height = 240,
}: ChartContainerProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [victory, setVictory] = useState(null);

  useEffect(() => {
    let active = true;
    import("victory-native")
      .then((module) => {
        if (active) setVictory(module);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!data.length) {
    return <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>{t("charts.empty")}</Text>;
  }

  const palette = [colors.primary, colors.secondary, colors.tertiary, colors.error];

  return (
    <View accessible accessibilityLabel={`${title}. ${summary}`} style={styles.root}>
      <Text style={[typeStyle("titleMedium"), { color: colors.onSurface }]}>{title}</Text>
      <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>{summary}</Text>
      <View style={{ height }}>
        {victory ? (
          <victory.CartesianChart data={data}>
            {series.map((entry, index) => (
              <victory.Line
                key={entry.key}
                yKey={entry.key}
                xKey="label"
                color={entry.color ?? palette[index % palette.length]}
                strokeWidth={2}
              />
            ))}
          </victory.CartesianChart>
        ) : (
          <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
            {t("app.loading")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[2],
  },
});