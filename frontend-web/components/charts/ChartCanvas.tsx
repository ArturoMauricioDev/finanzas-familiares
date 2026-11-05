"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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

export default function ChartCanvas({
  type,
  data,
  series,
  palette,
}: {
  type: ChartType;
  data: Array<Record<string, string | number>>;
  series: ChartSeries[];
  palette: string[];
}) {
  const colors = palette.length ? palette : ["currentColor"];

  if (type === "pie") {
    const dataKey = series[0]?.key ?? "value";
    const nameKey = series[0]?.label ?? "label";
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} outerRadius="80%" fill={colors[0]} />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          {series.map((entry, index) => (
            <Bar key={entry.key} dataKey={entry.key} fill={entry.color ?? colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
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