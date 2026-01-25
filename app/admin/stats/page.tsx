"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MiniLineChart } from "@/components/charts/MiniLineChart"
import { MiniBarChart } from "@/components/charts/MiniBarChart"

type Appointment = {
  id: number
  client_name: string
  client_phone: string
  service_name: string
  date: string
  time?: string
  service_duration?: number
  price?: number
  isPaid?: boolean
}

type Period = "day" | "week" | "month"

function mapAppointmentData(data: any[]): Appointment[] {
  return data.map((apt: any) => ({
    ...apt,
    isPaid: apt.is_paid !== undefined ? apt.is_paid : undefined,
  }))
}

function getLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return ""
  if (dateStr.includes("T")) return dateStr.split("T")[0]
  return dateStr
}

/** True si le RDV est déjà terminé (maintenant > fin du RDV). */
function hasAppointmentEnded(apt: Appointment): boolean {
  const d = normalizeDate(apt.date)
  const t = (apt.time || "00:00").trim()
  const dur = apt.service_duration ?? 30
  const parts = t.split(":")
  const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))
  const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0))
  const start = new Date(d + "T" + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00")
  if (isNaN(start.getTime())) return false
  const end = new Date(start.getTime() + dur * 60 * 1000)
  return Date.now() > end.getTime()
}

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getMonthBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function formatPeriodLabel(date: Date, period: Period): string {
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const y = String(date.getFullYear()).slice(2)
  if (period === "day") return `${date.getDate()}/${m}`
  if (period === "week") return `${getWeekBounds(date).start.getDate()}/${m}`
  return `${m}/${y}`
}

export default function StatsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("month")

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("id, client_name, client_phone, service_name, date, time, service_duration, price, is_paid")
          .order("date", { ascending: true })

        if (error) {
          console.error("Erreur chargement:", error)
          return
        }
        if (data) setAppointments(mapAppointmentData(data))
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  /** RDV comptés en stats : déjà terminés ET (payés ou non marqués). Les RDV à venir = non payés. */
  const paid = useMemo(
    () =>
      appointments.filter((a) => {
        if (!hasAppointmentEnded(a)) return false
        return a.isPaid !== false
      }),
    [appointments]
  )

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const { current, previous, chartData, labels } = useMemo(() => {
    const cur: Appointment[] = []
    const prev: Appointment[] = []
    const points: { period: string; תורים: number; הכנסות: number; לקוחות: number }[] = []
    const lab = { current: "", previous: "", chart: "" }

    if (period === "day") {
      const todayStr = getLocalDateString(today)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = getLocalDateString(yesterday)

      paid.forEach((a) => {
        const aptDate = normalizeDate(a.date)
        if (aptDate === todayStr) cur.push(a)
        if (aptDate === yesterdayStr) prev.push(a)
      })

      lab.current = "היום"
      lab.previous = "אתמול"
      lab.chart = "7 ימים אחרונים"

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const ds = getLocalDateString(d)
        const apts = paid.filter((a) => normalizeDate(a.date) === ds)
        points.push({
          period: `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}`,
          תורים: apts.length,
          הכנסות: apts.reduce((s, a) => s + (a.price || 0), 0),
          לקוחות: apts.length,
        })
      }
    } else if (period === "week") {
      const { start: ws, end: we } = getWeekBounds(today)
      const prevWeekEnd = new Date(ws)
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)
      const { start: pws, end: pwe } = getWeekBounds(prevWeekEnd)

      paid.forEach((a) => {
        const ad = new Date(normalizeDate(a.date) + "T00:00:00")
        if (ad >= ws && ad <= we) cur.push(a)
        if (ad >= pws && ad <= pwe) prev.push(a)
      })

      lab.current = "השבוע"
      lab.previous = "השבוע שעבר"
      lab.chart = "7 שבועות אחרונים"

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - 7 * i)
        const { start } = getWeekBounds(d)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        const apts = paid.filter((a) => {
          const ad = new Date(normalizeDate(a.date) + "T00:00:00")
          return ad >= start && ad <= end
        })
        points.push({
          period: formatPeriodLabel(d, "week"),
          תורים: apts.length,
          הכנסות: apts.reduce((s, a) => s + (a.price || 0), 0),
          לקוחות: apts.length,
        })
      }
    } else {
      const { start: ms, end: me } = getMonthBounds(today)
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const { start: pms, end: pme } = getMonthBounds(prevMonth)

      paid.forEach((a) => {
        const ad = new Date(normalizeDate(a.date) + "T00:00:00")
        if (ad >= ms && ad <= me) cur.push(a)
        if (ad >= pms && ad <= pme) prev.push(a)
      })

      lab.current = "החודש"
      lab.previous = "החודש שעבר"
      lab.chart = "7 חודשים אחרונים"

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const { start, end } = getMonthBounds(d)
        const apts = paid.filter((a) => {
          const ad = new Date(normalizeDate(a.date) + "T00:00:00")
          return ad >= start && ad <= end
        })
        points.push({
          period: formatPeriodLabel(d, "month"),
          תורים: apts.length,
          הכנסות: apts.reduce((s, a) => s + (a.price || 0), 0),
          לקוחות: apts.length,
        })
      }
    }

    return { current: cur, previous: prev, chartData: points, labels: lab }
  }, [paid, period, today])

  const revenueCurrent = current.reduce((s, a) => s + (a.price || 0), 0)
  const revenuePrev = previous.reduce((s, a) => s + (a.price || 0), 0)
  const appointmentsCurrent = current.length
  const appointmentsPrev = previous.length
  const revenueChange = revenuePrev ? ((revenueCurrent - revenuePrev) / revenuePrev) * 100 : 0
  const appointmentsChange = appointmentsPrev
    ? ((appointmentsCurrent - appointmentsPrev) / appointmentsPrev) * 100
    : 0

  const revenueDiff = revenueCurrent - revenuePrev
  const appointmentsDiff = appointmentsCurrent - appointmentsPrev

  const periodLabels = { day: "יום", week: "שבוע", month: "חודש" }
  const addLabel =
    period === "day"
      ? "לעומת אתמול"
      : period === "week"
      ? "לעומת השבוע שעבר"
      : "לעומת החודש שעבר"

  const revenueFirst = chartData[0]?.הכנסות ?? 0
  const revenueLast = chartData[chartData.length - 1]?.הכנסות ?? 0
  const changeAllPeriod =
    revenueFirst > 0 ? ((revenueLast - revenueFirst) / revenueFirst) * 100 : 0

  if (isLoading) {
    return (
      <div className="w-full p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-2xl">
                <PieChart className="w-6 h-6" />
                דוחות
              </CardTitle>
            </CardHeader>
          </Card>
          <div className="text-center py-12">
            <p className="text-slate-400">טוען נתונים...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-white text-2xl">
                <PieChart className="w-6 h-6" />
                דוחות
              </CardTitle>
            </CardHeader>
          </Card>
          <div className="flex gap-2 rounded-lg bg-slate-800 p-1 border border-slate-700">
            {(["day", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-slate-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* תורים */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">תורים</CardTitle>
              <p className="text-2xl font-bold text-white">{appointmentsCurrent}</p>
              <p
                className={`text-sm ${
                  appointmentsDiff >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {appointmentsDiff >= 0 ? "+" : ""}
                {appointmentsDiff} {addLabel}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full">
                <MiniLineChart data={chartData} dataKey="תורים" color="#3b82f6" />
              </div>
            </CardContent>
          </Card>

          {/* הכנסות */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">הכנסות</CardTitle>
              <p className="text-2xl font-bold text-white">
                ₪{revenueCurrent.toLocaleString("he-IL")}
              </p>
              <p
                className={`text-sm ${
                  revenueDiff >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {revenueDiff >= 0 ? "₪+" : "₪"}
                {revenueDiff.toLocaleString("he-IL")} {addLabel}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full">
                <MiniBarChart data={chartData} dataKey="הכנסות" color="#22c55e" />
              </div>
            </CardContent>
          </Card>

          {/* לקוחות */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                לקוחות
                <span
                  className={`text-sm font-normal ${
                    appointmentsChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {appointmentsChange >= 0 ? "+" : ""}
                  {appointmentsChange.toFixed(0)}%
                </span>
              </CardTitle>
              <p className="text-2xl font-bold text-white">{appointmentsCurrent}</p>
              <p className="text-sm text-slate-400">{labels.current}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full">
                <MiniBarChart data={chartData} dataKey="לקוחות" color="#f97316" />
              </div>
            </CardContent>
          </Card>

          {/* שינוי בהכנסה */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                שינוי בהכנסה
                <span
                  className={`text-sm font-normal ${
                    revenueChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {revenueChange >= 0 ? "+" : ""}
                  {revenueChange.toFixed(1)}%
                </span>
              </CardTitle>
              <p className="text-sm text-green-400">
                {changeAllPeriod >= 0 ? "+" : ""}
                {changeAllPeriod.toFixed(1)}% שינוי בכל התקופה
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full">
                <MiniLineChart
                  data={chartData.map((p, i) => {
                    const prevVal = i > 0 ? chartData[i - 1].הכנסות : 0
                    const currVal = p.הכנסות
                    const pct =
                      prevVal === 0 ? 0 : ((currVal - prevVal) / prevVal) * 100
                    return { ...p, שינוי: Math.round(pct * 10) / 10 }
                  })}
                  dataKey="שינוי"
                  color="#22c55e"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
