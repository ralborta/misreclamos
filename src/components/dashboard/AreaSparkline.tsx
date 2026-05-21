import React from "react";

type Point = {
  label: string;
  value: number;
};

type Props = {
  data: Point[];
  height?: number;
  /** Color del trazo y relleno (con alpha aplicado al área) */
  color?: string;
};

/**
 * SVG ligero estilo área. Sin librerías externas. Adaptable al contenedor.
 */
export function AreaSparkline({ data, height = 160, color = "#2196F3" }: Props) {
  if (data.length === 0) return null;

  const width = 600; // viewBox virtual; el SVG escala con CSS
  const padX = 24;
  const padTop = 24;
  const padBottom = 28;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padX + i * step;
    const y = padTop + innerH - (d.value / maxVal) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L${points[points.length - 1].x.toFixed(1)},${padTop + innerH} L${points[0].x.toFixed(1)},${padTop + innerH} Z`;

  const gridYs = [0.25, 0.5, 0.75].map((f) => padTop + innerH - f * innerH);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaSparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => (
        <line key={i} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 4" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#areaSparklineGradient)" stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill="#0F172A" fontWeight="600">
            {p.value}
          </text>
          <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
