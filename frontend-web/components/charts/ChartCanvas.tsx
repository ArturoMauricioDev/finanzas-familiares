"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartSeries, ChartType } from "./ChartContainer";

interface ChartTheme {
  grid: string;
  axis: string;
  surface: string;
  onSurface: string;
}

export default function ChartCanvas({
  type,
  data,
  series,
  palette,
  theme,
}: {
  type: ChartType;
  data: Array<Record<string, string | number>>;
  series: ChartSeries[];
  palette: string[];
  theme: ChartTheme;
}) {
  const colors = palette.length ? palette : ["currentColor"];
  const axisProps = {
    stroke: theme.axis,
    tick: { fill: theme.axis },
    tickLine: false,
    axisLine: { stroke: theme.grid },
  };
  const tooltipProps = {
    contentStyle: {
      backgroundColor: theme.surface,
      borderColor: theme.grid,
      color: theme.onSurface,
    },
    labelStyle: { color: theme.onSurface },
    itemStyle: { color: theme.onSurface },
  };
  const grid = <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />;

  if (type === "pie") {
    const dataKey = series[0]?.key ?? "value";
    const nameKey = series[0]?.label ?? "label";
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} outerRadius="80%" fill={colors[0]}>
            {data.map((entry, index) => (
              <Cell
                key={`${String(entry[nameKey] ?? index)}-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip {...tooltipProps} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          {grid}
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipProps} />
          {series.map((entry, index) => (
            <Bar key={entry.key} dataKey={entry.key} fill={entry.color ?? colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          {grid}
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipProps} />
          {series.map((entry, index) => {
            const color = entry.color ?? colors[index % colors.length];
            return (
              <Area
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                stroke={color}
                fill={color}
                fillOpacity={0.25}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        {grid}
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipProps} />
        {series.map((entry, index) => (
          <Line
            key={entry.key}
            type="monotone"
            dataKey={entry.key}
            stroke={entry.color ?? colors[index % colors.length]}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
