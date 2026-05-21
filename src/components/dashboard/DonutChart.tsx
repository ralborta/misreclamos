import React from "react";

export type DonutSegment = {
  label: string;
  value: number;
  /** Color CSS válido para SVG fill (ej: "#2196F3" o "rgb(...)") */
  color: string;
};

type Props = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
};

export function DonutChart({ segments, size = 144, thickness = 18, centerLabel = "Total", centerValue }: Props) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s, idx) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = circumference * fraction;
      const gap = circumference - dash;
      const node = (
        <circle
          key={`${s.label}-${idx}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={-offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      );
      offset += dash;
      return node;
    });

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E2E8F0"
          strokeWidth={thickness}
        />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900 leading-none">{centerValue ?? total}</span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{centerLabel}</span>
      </div>
    </div>
  );
}
