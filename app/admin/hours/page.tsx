"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

const DAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "שבת"] as const

type OperatingHourRow = {
  day_of_week: number
  is_closed: boolean
  start_time: string | null
  end_time: string | null
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

function formatDateShort(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}`
}

export default function HoursPage() {
  const [operatingHours, setOperatingHours] = useState<OperatingHourRow[]>([])
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editRows, setEditRows] = useState<OperatingHourRow[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editingDayOfWeek, setEditingDayOfWeek] = useState<number | null>(null)
  const [singleEditRow, setSingleEditRow] = useState<OperatingHourRow | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("operating_hours")
          .select("day_of_week, is_closed, start_time, end_time")
          .order("day_of_week", { ascending: true })

        if (error) {
          console.error("Erreur chargement operating_hours:", error)
          return
        }
        if (data?.length) {
          setOperatingHours(
            data.map((r) => ({
              day_of_week: r.day_of_week,
              is_closed: !!r.is_closed,
              start_time: r.start_time ?? null,
              end_time: r.end_time ?? null,
            }))
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const { start, end } = getWeekBounds(weekStart)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  const openEditModal = () => {
    closeSingleDayModal()
    setEditRows(
      operatingHours.length
        ? operatingHours.map((r) => ({ ...r }))
        : DAYS.map((_, i) => ({
            day_of_week: i,
            is_closed: true,
            start_time: null,
            end_time: null,
          }))
    )
    setIsEditModalOpen(true)
  }

  const updateEditRow = (dayIndex: number, patch: Partial<OperatingHourRow>) => {
    setEditRows((prev) => {
      const out = [...prev]
      const idx = out.findIndex((r) => r.day_of_week === dayIndex)
      if (idx < 0) return prev
      out[idx] = { ...out[idx], ...patch }
      return out
    })
  }

  const saveHours = async () => {
    setIsSaving(true)
    try {
      const rows = editRows.map((r) => ({
        day_of_week: r.day_of_week,
        is_closed: r.is_closed,
        start_time: r.is_closed ? null : (r.start_time || "09:00"),
        end_time: r.is_closed ? null : (r.end_time || "18:00"),
      }))
      const { error } = await supabase
        .from("operating_hours")
        .upsert(rows, { onConflict: "day_of_week" })

      if (error) {
        console.error("Erreur upsert operating_hours:", error)
        alert("אירעה שגיאה בשמירת השעות")
        return
      }
      setOperatingHours(editRows.map((r) => ({ ...r })))
      setIsEditModalOpen(false)
    } catch (e) {
      console.error(e)
      alert("אירעה שגיאה בשמירת השעות")
    } finally {
      setIsSaving(false)
    }
  }

  const getHourForDay = (dayOfWeek: number) =>
    operatingHours.find((r) => r.day_of_week === dayOfWeek)

  const openSingleDayModal = (dayOfWeek: number) => {
    const existing = getHourForDay(dayOfWeek)
    setSingleEditRow(
      existing
        ? { ...existing }
        : {
            day_of_week: dayOfWeek,
            is_closed: true,
            start_time: null,
            end_time: null,
          }
    )
    setEditingDayOfWeek(dayOfWeek)
  }

  const updateSingleEditRow = (patch: Partial<OperatingHourRow>) => {
    if (!singleEditRow) return
    setSingleEditRow((prev) => (prev ? { ...prev, ...patch } : null))
  }

  const saveSingleDay = async () => {
    if (!singleEditRow) return
    setIsSaving(true)
    try {
      const row = {
        day_of_week: singleEditRow.day_of_week,
        is_closed: singleEditRow.is_closed,
        start_time: singleEditRow.is_closed ? null : (singleEditRow.start_time || "09:00"),
        end_time: singleEditRow.is_closed ? null : (singleEditRow.end_time || "18:00"),
      }
      const { error } = await supabase
        .from("operating_hours")
        .upsert([row], { onConflict: "day_of_week" })

      if (error) {
        console.error("Erreur upsert operating_hours:", error)
        alert("אירעה שגיאה בשמירת השעות")
        return
      }
      setOperatingHours((prev) => {
        const out = prev.filter((r) => r.day_of_week !== singleEditRow.day_of_week)
        out.push({ ...singleEditRow, ...row })
        out.sort((a, b) => a.day_of_week - b.day_of_week)
        return out
      })
      setEditingDayOfWeek(null)
      setSingleEditRow(null)
    } catch (e) {
      console.error(e)
      alert("אירעה שגיאה בשמירת השעות")
    } finally {
      setIsSaving(false)
    }
  }

  const closeSingleDayModal = () => {
    if (!isSaving) {
      setEditingDayOfWeek(null)
      setSingleEditRow(null)
    }
  }

  return (
    <div className="w-full p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-2xl">
              <Clock className="w-6 h-6" />
              שעות פתיחה
            </CardTitle>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">טוען...</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <Button
                variant="outline"
                onClick={openEditModal}
                className="flex items-center gap-2 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              >
                <Pencil className="w-4 h-4" />
                עריכת שעות
              </Button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(weekStart)
                    prev.setDate(prev.getDate() - 7)
                    setWeekStart(prev)
                  }}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-600 text-white hover:bg-slate-700"
                  aria-label="שבוע קודם"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-white font-medium min-w-[180px] text-center">
                  {formatDateShort(start)} – {formatDateShort(end)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(weekStart)
                    next.setDate(next.getDate() + 7)
                    setWeekStart(next)
                  }}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-600 text-white hover:bg-slate-700"
                  aria-label="שבוע הבא"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-right py-4 px-3 text-slate-400 font-medium w-28">
                        שם
                      </th>
                      {weekDates.map((d) => (
                        <th
                          key={d.toISOString()}
                          className="text-center py-4 px-2 text-slate-300 font-medium min-w-[100px]"
                        >
                          <div>{DAYS[d.getDay()]}</div>
                          <div className="text-sm text-slate-400 mt-0.5">
                            {formatDateShort(d)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="py-4 px-3 text-white font-medium">
                        דן כהן
                      </td>
                      {weekDates.map((d) => {
                        const hr = getHourForDay(d.getDay())
                        const closed = hr?.is_closed ?? true
                        const today = new Date()
                        const isToday =
                          today.getFullYear() === d.getFullYear() &&
                          today.getMonth() === d.getMonth() &&
                          today.getDate() === d.getDate()
                        return (
                          <td
                            key={d.toISOString()}
                            role="button"
                            tabIndex={0}
                            onClick={() => openSingleDayModal(d.getDay())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                openSingleDayModal(d.getDay())
                              }
                            }}
                            className={`py-4 px-2 text-center min-w-[100px] cursor-pointer transition-colors hover:ring-2 hover:ring-blue-500 hover:ring-inset rounded ${
                              isToday ? "ring-2 ring-blue-500 ring-inset " : ""
                            }${
                              closed
                                ? "bg-slate-700/50 text-red-300/90 hover:bg-slate-700"
                                : "text-slate-200 hover:bg-slate-700/80"
                            }`}
                          >
                            {closed
                              ? "לא עובד/ת"
                              : `${hr?.start_time ?? ""} – ${hr?.end_time ?? ""}`}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {editingDayOfWeek !== null && singleEditRow && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            dir="rtl"
            onClick={closeSingleDayModal}
          >
            <Card
              className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex items-center justify-between border-b border-slate-700">
                <CardTitle className="text-xl text-white">
                  עריכת שעות – {DAYS[singleEditRow.day_of_week]}
                </CardTitle>
                <button
                  type="button"
                  onClick={closeSingleDayModal}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="single-day-closed"
                        checked={singleEditRow.is_closed}
                        onChange={() =>
                          updateSingleEditRow({
                            is_closed: true,
                            start_time: null,
                            end_time: null,
                          })
                        }
                        className="rounded-full"
                      />
                      <span className="text-slate-300">סגור</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="single-day-closed"
                        checked={!singleEditRow.is_closed}
                        onChange={() =>
                          updateSingleEditRow({
                            is_closed: false,
                            start_time: singleEditRow.start_time || "09:00",
                            end_time: singleEditRow.end_time || "18:00",
                          })
                        }
                        className="rounded-full"
                      />
                      <span className="text-slate-300">פתוח</span>
                    </label>
                  </div>
                  {!singleEditRow.is_closed && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-slate-400 text-sm">מ־</Label>
                        <Input
                          type="time"
                          value={singleEditRow.start_time || "09:00"}
                          onChange={(e) =>
                            updateSingleEditRow({ start_time: e.target.value })
                          }
                          className="w-32 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="text-slate-400 text-sm">עד</Label>
                        <Input
                          type="time"
                          value={singleEditRow.end_time || "18:00"}
                          onChange={(e) =>
                            updateSingleEditRow({ end_time: e.target.value })
                          }
                          className="w-32 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
                <Button
                  variant="outline"
                  onClick={closeSingleDayModal}
                  disabled={isSaving}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  ביטול
                </Button>
                <Button
                  onClick={saveSingleDay}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "שומר..." : "שמור"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {isEditModalOpen && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            dir="rtl"
            onClick={() => !isSaving && setIsEditModalOpen(false)}
          >
            <Card
              className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border-slate-700 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex items-center justify-between border-b border-slate-700 flex-shrink-0">
                <CardTitle className="text-xl text-white">
                  עריכת שעות פתיחה
                </CardTitle>
                <button
                  type="button"
                  onClick={() => !isSaving && setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                {editRows.map((row) => (
                  <div
                    key={row.day_of_week}
                    className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                  >
                    <div className="w-24 font-medium text-white">
                      {DAYS[row.day_of_week]}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`day-${row.day_of_week}`}
                          checked={row.is_closed}
                          onChange={() =>
                            updateEditRow(row.day_of_week, {
                              is_closed: true,
                              start_time: null,
                              end_time: null,
                            })
                          }
                          className="rounded-full"
                        />
                        <span className="text-slate-300">סגור</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`day-${row.day_of_week}`}
                          checked={!row.is_closed}
                          onChange={() =>
                            updateEditRow(row.day_of_week, {
                              is_closed: false,
                              start_time: row.start_time || "09:00",
                              end_time: row.end_time || "18:00",
                            })
                          }
                          className="rounded-full"
                        />
                        <span className="text-slate-300">פתוח</span>
                      </label>
                    </div>
                    {!row.is_closed && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label className="text-slate-400 text-sm">מ־</Label>
                          <Input
                            type="time"
                            value={row.start_time || "09:00"}
                            onChange={(e) =>
                              updateEditRow(row.day_of_week, {
                                start_time: e.target.value,
                              })
                            }
                            className="w-32 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-slate-400 text-sm">עד</Label>
                          <Input
                            type="time"
                            value={row.end_time || "18:00"}
                            onChange={(e) =>
                              updateEditRow(row.day_of_week, {
                                end_time: e.target.value,
                              })
                            }
                            className="w-32 bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-700 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => !isSaving && setIsEditModalOpen(false)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  ביטול
                </Button>
                <Button
                  onClick={saveHours}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "שומר..." : "שמור"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
