"use client"

type Point = { period: string; [k: string]: string | number }

export function MiniBarChart({
  data,
  dataKey,
  color = "#22c55e",
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
  const barCount = data.length
  const barGap = 4
  const barWidth = (chartW - barGap * (barCount - 1)) / barCount
  const barTotal = barWidth + barGap

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full min-h-[120px]"
      aria-hidden
    >
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
      {values.map((v, i) => {
        const barH = max > 0 ? (v / max) * chartH : 0
        const x = padding.left + i * barTotal
        const y = padding.top + chartH - barH
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx={4}
            ry={4}
            fill={color}
          />
        )
      })}
      {data.map((d, i) => (
        <text
          key={i}
          x={padding.left + i * barTotal + barWidth / 2}
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
