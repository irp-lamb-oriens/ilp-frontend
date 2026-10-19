"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import styles from "./charts.module.scss";

// Brand palette (mirrors styles/_variables.scss) so charts stay cohesive.
const PALETTE = {
  accent: "#5cccf7",
  navy: "#123b5d",
  charcoal: "#202a33",
  steel: "#4a5a66",
  muted: "#7a8a96",
  success: "#1f7a5c",
  warning: "#b7791f",
  error: "#c0392b",
  mist: "#eff7fb",
  coolGray: "#d9e1e6",
};

const SERIES = [
  PALETTE.accent,
  PALETTE.navy,
  PALETTE.success,
  PALETTE.warning,
  PALETTE.steel,
  PALETTE.error,
];

export interface ChartDatum {
  label: string;
  value: number;
  [key: string]: string | number;
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid rgba(18, 59, 93, 0.14)",
  fontSize: "0.8rem",
  boxShadow: "0 1px 2px rgba(18, 59, 93, 0.06)",
};

function EmptyState({ message }: { message: string }) {
  return <p className={styles.empty}>{message}</p>;
}

/** Vertical bar chart for a single series of { label, value }. */
export function SimpleBarChart({
  data,
  color = PALETTE.accent,
  emptyMessage = "No data yet.",
  valueFormatter,
}: {
  data: ChartDatum[];
  color?: string;
  emptyMessage?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.coolGray} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: PALETTE.steel, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={data.length > 6 ? -30 : 0}
            textAnchor={data.length > 6 ? "end" : "middle"}
            height={data.length > 6 ? 60 : 30}
          />
          <YAxis
            tick={{ fill: PALETTE.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : String(v))}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bar chart for ranked buckets (routes, services, providers). */
export function RankedBarChart({
  data,
  color = PALETTE.navy,
  emptyMessage = "No data yet.",
  valueFormatter,
}: {
  data: ChartDatum[];
  color?: string;
  emptyMessage?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.coolGray} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: PALETTE.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={valueFormatter}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: PALETTE.steel, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : String(v))}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut chart for a win-rate style proportion. */
export function DonutChart({
  value,
  total,
  label,
  color = PALETTE.success,
  emptyMessage = "No data yet.",
}: {
  value: number;
  total: number;
  label: string;
  color?: string;
  emptyMessage?: string;
}) {
  if (total <= 0) return <EmptyState message={emptyMessage} />;
  const pct = Math.round((value / total) * 100);
  const data = [
    { name: label, value },
    { name: "Remaining", value: Math.max(0, total - value) },
  ];
  return (
    <div className={styles.donutWrap}>
      <div className={styles.chart} style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={85}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill={PALETTE.coolGray} />
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.donutCenter}>
        <span className={styles.donutValue}>{pct}%</span>
        <span className={styles.donutLabel}>{label}</span>
      </div>
    </div>
  );
}

/** Line/area chart for a time series of { label, value }. */
export function TrendChart({
  data,
  color = PALETTE.accent,
  emptyMessage = "No data yet.",
  valueFormatter,
}: {
  data: ChartDatum[];
  color?: string;
  emptyMessage?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.coolGray} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: PALETTE.steel, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: PALETTE.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : String(v))}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped bar chart for comparing multiple series (e.g. revenue vs cost). */
export function GroupedBarChart({
  data,
  series,
  colors = SERIES,
  emptyMessage = "No data yet.",
  valueFormatter,
}: {
  data: Array<Record<string, string | number>>;
  series: Array<{ key: string; name: string }>;
  colors?: string[];
  emptyMessage?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.coolGray} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: PALETTE.steel, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: PALETTE.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : String(v))}
          />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PALETTE };