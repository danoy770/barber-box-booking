"use client"

type Point = { period: string; [k: string]: string | number }

export function MiniLineChart({
  data,
  dataKey,
  color = "#3b82f6",
}: {
  data: Point[]
  dataKey: string
  color?: string
}) {
  if (!data.length) return null
  const padding = { top: 10, right: 12, bottom: 28, left: 36 }
  const w = 400
  const h = 160
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom
  const values = data.map((d) => Number(d[dataKey]) ?? 0)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const step = data.length > 1 ? chartW / (data.length - 1) : chartW
  const points = values.map((v, i) => {
    const x = padding.left + i * step
    const y = padding.top + chartH - ((v - min) / range) * chartH
    return `${x},${y}`
  })
  const pathD = points.length ? `M ${points[0]} L ${points.slice(1).join(" L ")}` : ""

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full min-h-[120px]"
      aria-hidden
    >
      <defs>
        <linearGradient id={`line-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* grille */}
      {[0.25, 0.5, 0.75].map((q) => (
        <line
          key={q}
          x1={padding.left}
          y1={padding.top + chartH * q}
          x2={w - padding.right}
          y2={padding.top + chartH * q}
          stroke="#334155"
          strokeDasharray="3 3"
          strokeWidth={0.5}
        />
      ))}
      {/* remplissage sous la courbe */}
      <path
        d={`${pathD} L ${padding.left + (data.length - 1) * step},${padding.top + chartH} L ${padding.left},${padding.top + chartH} Z`}
        fill={`url(#line-grad-${color.replace("#", "")})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={padding.left + i * step}
          cy={padding.top + chartH - ((v - min) / range) * chartH}
          r={3}
          fill={color}
        />
      ))}
      {/* labels X */}
      {data.map((d, i) => (
        <text
          key={i}
          x={padding.left + i * step}
          y={h - 6}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
        >
          {d.period}
        </text>
      ))}
    </svg>
  )
}
