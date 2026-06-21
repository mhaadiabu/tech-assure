import type { CSSProperties } from "react";

export function SparklinePath({
  values,
  width = 200,
  height = 56,
  stroke = "currentColor",
  strokeWidth = 1.5,
  fill = false,
  fillColor,
  style,
  className,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: boolean;
  fillColor?: string;
  style?: CSSProperties;
  className?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = fill
    ? `${linePath} L${width},${height} L0,${height} Z`
    : linePath;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={style}
      className={className}
    >
      {fill ? (
        <path d={areaPath} fill={fillColor ?? stroke} fillOpacity={0.12} />
      ) : null}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BarColumn({
  values,
  width = 200,
  height = 64,
  fill = "currentColor",
  gap = 2,
  radius = 1.5,
  style,
  className,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  fill?: string;
  gap?: number;
  radius?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const max = Math.max(...values, 1);
  const slot = (width - gap * (values.length - 1)) / values.length;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={style}
      className={className}
    >
      {values.map((v, i) => {
        const h = (v / max) * (height - 4);
        const x = i * (slot + gap);
        const y = height - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={slot}
            height={h}
            rx={radius}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}

export function DonutRing({
  value,
  size = 96,
  stroke = 8,
  trackColor = "var(--border)",
  fillColor = "var(--accent-warm)",
  label,
  className,
  style,
}: {
  value: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  fillColor?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={style}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={fillColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {label ? (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-geist-sans, system-ui)"
          fontSize={size * 0.22}
          fontWeight={600}
          fill="var(--foreground)"
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}
