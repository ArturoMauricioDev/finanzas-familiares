"use client";

import dynamic from "next/dynamic";

import { useI18n } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

export type ChartType = "line" | "bar" | "pie" | "area";

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ChartContainerProps {
  type: ChartType;
  data: Array<Record<string, string | number>>;
  series: ChartSeries[];
  title: string;
  summary: string;
  height?: number;
}

const ChartCanvas = dynamic(() => import("./ChartCanvas"), {
  ssr: false,
  loading: () => <span className="text-body-medium text-on-surface-variant" />,
});

export function ChartContainer({
  type,
  data,
  series,
  title,
  summary,
  height = 240,
}: ChartContainerProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!data.length) {
    return <p className="text-body-medium text-on-surface-variant">{t("charts.empty")}</p>;
  }

  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-title-medium text-on-surface">{title}</h3>
      <p className="text-body-small text-on-surface-variant">{summary}</p>
      <div style={{ height }} role="img" aria-label={summary}>
        <ChartCanvas
          type={type}
          data={data}
          series={series}
          palette={[colors.primary, colors.secondary, colors.tertiary, colors.error]}
        />
      </div>
    </section>
  );
}