"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Scissors,
  Plus,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type Category = {
  id: number
  name: string
  sort_order: number
}

type Service = {
  id: number
  category_id: number
  name: string
  notes: string
  price: number
  price_is_min: boolean
  duration_minutes: number
  calendar_color: string
  hidden_from_booking: boolean
  sort_order: number
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
          checked ? "bg-blue-600" : "bg-slate-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-slate-300 text-sm">{label}</span>
    </label>
  )
}

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [modal, setModal] = useState<
    | { type: "edit"; service: Service }
    | { type: "add-service"; categoryId?: number }
    | { type: "add-category" }
    | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [dragged, setDragged] = useState<Service | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [justDragged, setJustDragged] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, srvRes] = await Promise.all([
        supabase.from("categories").select("id, name, sort_order").order("sort_order", { ascending: true }),
        supabase
          .from("services")
          .select("id, category_id, name, notes, price, price_is_min, duration_minutes, calendar_color, hidden_from_booking, sort_order")
          .order("category_id", { ascending: true })
          .order("sort_order", { ascending: true }),
      ])
      if (catRes.error) {
        console.error("categories", catRes.error)
        return
      }
      if (srvRes.error) {
        console.error("services", srvRes.error)
        return
      }
      setCategories((catRes.data as Category[]) ?? [])
      setServices((srvRes.data as Service[]) ?? [])
      setExpanded((prev) => {
        const next = { ...prev }
        ;((catRes.data as Category[]) ?? []).forEach((c) => {
          if (next[c.id] === undefined) next[c.id] = true
        })
        return next
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const servicesByCategory = categories.map((cat) => ({
    category: cat,
    items: services.filter((s) => s.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order),
  }))

  const toggleCategory = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openEdit = (s: Service) => setModal({ type: "edit", service: { ...s } })
  const openAddService = (categoryId?: number) =>
    setModal({
      type: "add-service",
      categoryId: categoryId ?? categories[0]?.id,
    })
  const openAddCategory = () => setModal({ type: "add-category" })
  const closeModal = () => {
    if (!saving) setModal(null)
  }

  const handleDragStart = (e: React.DragEvent, s: Service) => {
    setDragged(s)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(s.id))
  }
  const handleDragOver = (e: React.DragEvent, _s: Service) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragged) setDragOver(_s.id)
  }
  const handleDragLeave = () => setDragOver(null)
  const handleDrop = async (e: React.DragEvent, target: Service) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragged || dragged.id === target.id || dragged.category_id !== target.category_id) {
      setDragged(null)
      return
    }
    setJustDragged(true)
    const list = services.filter((s) => s.category_id === dragged.category_id).sort((a, b) => a.sort_order - b.sort_order)
    const fromIdx = list.findIndex((s) => s.id === dragged.id)
    const toIdx = list.findIndex((s) => s.id === target.id)
    if (fromIdx < 0 || toIdx < 0) {
      setDragged(null)
      return
    }
    const reordered = [...list]
    const [removed] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, removed)
    setSaving(true)
    try {
      for (let i = 0; i < reordered.length; i++) {
        await supabase.from("services").update({ sort_order: i }).eq("id", reordered[i].id)
      }
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
      setDragged(null)
      setTimeout(() => setJustDragged(false), 100)
    }
  }
  const handleDragEnd = () => {
    setDragged(null)
    setDragOver(null)
  }
  const handleRowClick = (s: Service) => {
    if (justDragged) return
    openEdit(s)
  }

  return (
    <div className="w-full p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-2xl">
              <Scissors className="w-6 h-6" />
              שירותים
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => openAddService()}
            className="bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
          >
            <Plus className="w-4 h-4 ms-2" />
            הוספת שירות
          </Button>
          <Button
            onClick={openAddCategory}
            variant="outline"
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 ms-2" />
            הוספת קטגוריה
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">טוען...</div>
        ) : (
          <div className="space-y-4">
            {servicesByCategory.map(({ category, items }) => (
              <Card key={category.id} className="bg-slate-800 border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-white">{category.name}</span>
                  {expanded[category.id] !== false ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {expanded[category.id] !== false && (
                  <div className="border-t border-slate-700">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, s)}
                        onDragOver={(e) => handleDragOver(e, s)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, s)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleRowClick(s)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0 ${
                          dragOver === s.id ? "ring-2 ring-inset ring-blue-500 bg-slate-700/80" : ""
                        } ${dragged?.id === s.id ? "opacity-50" : ""}`}
                      >
                        <span
                          className="text-slate-500 hover:text-slate-400 touch-none cursor-grab active:cursor-grabbing"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-5 h-5" />
                        </span>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="font-medium text-white">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{s.duration_minutes} דק׳</span>
                          <span className="font-semibold text-slate-300">
                            {s.price_is_min ? "החל מ " : ""}₪{s.price}
                          </span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="px-4 py-6 text-center text-slate-500">
                        אין שירותים.{" "}
                        <button
                          type="button"
                          onClick={() => openAddService(category.id)}
                          className="text-blue-400 hover:underline"
                        >
                          הוסף שירות
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {modal?.type === "add-category" && (
        <AddCategoryModal
          onClose={closeModal}
          onSaved={() => {
            load()
            closeModal()
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}

      {(modal?.type === "edit" || modal?.type === "add-service") && (
        <EditServiceModal
          categories={categories}
          service={modal.type === "edit" ? modal.service : null}
          defaultCategoryId={modal.type === "add-service" ? modal.categoryId : undefined}
          onClose={closeModal}
          onSaved={() => {
            load()
            closeModal()
          }}
          saving={saving}
          setSaving={setSaving}
        />
      )}
    </div>
  )
}

function AddCategoryModal({
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  onClose: () => void
  onSaved: () => void
  saving: boolean
  setSaving: (v: boolean) => void
}) {
  const [name, setName] = useState("")

  const save = async () => {
    const n = name.trim()
    if (!n) return
    setSaving(true)
    try {
      const { data: maxRow } = await supabase
        .from("categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
      const next = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 1
      const { error } = await supabase.from("categories").insert({ name: n, sort_order: next })
      if (error) {
        console.error(error)
        return
      }
      onSaved()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
          <CardTitle className="text-xl text-white">הוספת קטגוריה</CardTitle>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-slate-400">שם הקטגוריה</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: תספורות"
              className="mt-2 bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            ביטול
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "שומר..." : "שמור"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function EditServiceModal({
  categories,
  service,
  defaultCategoryId,
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  categories: Category[]
  service: Service | null
  defaultCategoryId?: number
  onClose: () => void
  onSaved: () => void
  saving: boolean
  setSaving: (v: boolean) => void
}) {
  const isNew = !service
  const [name, setName] = useState(service?.name ?? "")
  const [notes, setNotes] = useState(service?.notes ?? "")
  const [categoryId, setCategoryId] = useState<number>(service?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? 0)
  const [price, setPrice] = useState(service?.price ?? 0)
  const [priceIsMin, setPriceIsMin] = useState(service?.price_is_min ?? false)
  const [durationMinutes, setDurationMinutes] = useState(service?.duration_minutes ?? 15)
  const [calendarColor, setCalendarColor] = useState(service?.calendar_color ?? "#6366f1")
  const [hiddenFromBooking, setHiddenFromBooking] = useState(service?.hidden_from_booking ?? false)

  const save = async () => {
    const n = name.trim()
    if (!n) return
    const cid = categoryId || categories[0]?.id
    if (!cid) return
    setSaving(true)
    try {
      if (isNew) {
        const { data: maxRow } = await supabase
          .from("services")
          .select("sort_order")
          .eq("category_id", cid)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle()
        const nextOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? -1) + 1
        const { error } = await supabase.from("services").insert({
          category_id: cid,
          name: n,
          notes: notes.trim(),
          price: Number(price) || 0,
          price_is_min: priceIsMin,
          duration_minutes: Number(durationMinutes) || 15,
          calendar_color: calendarColor,
          hidden_from_booking: hiddenFromBooking,
          sort_order: nextOrder,
        })
        if (error) {
          console.error(error)
          return
        }
      } else {
        const { error } = await supabase
          .from("services")
          .update({
            name: n,
            notes: notes.trim(),
            category_id: cid,
            price: Number(price) || 0,
            price_is_min: priceIsMin,
            duration_minutes: Number(durationMinutes) || 15,
            calendar_color: calendarColor,
            hidden_from_booking: hiddenFromBooking,
          })
          .eq("id", service!.id)
        if (error) {
          console.error(error)
          return
        }
      }
      onSaved()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const deleteService = async () => {
    if (!service || !confirm("למחוק את השירות?")) return
    setSaving(true)
    try {
      const { error } = await supabase.from("services").delete().eq("id", service.id)
      if (error) {
        console.error(error)
        return
      }
      onSaved()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] bg-slate-800 border-slate-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700 flex-shrink-0">
          <CardTitle className="text-xl text-white">{isNew ? "הוספת שירות" : "עריכת שירות"}</CardTitle>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="pt-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div>
            <Label className="text-slate-400">כותרת</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם השירות"
              className="mt-2 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-400">הערות</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות (אופציונלי)"
              rows={3}
              className="mt-2 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>
          <div>
            <Label className="text-slate-400">קטגוריה</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="mt-2 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              dir="rtl"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Toggle label="החל מ" checked={priceIsMin} onChange={setPriceIsMin} />
            <div className="flex items-center gap-2">
              <Label className="text-slate-400">מחיר (₪)</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-24 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-400">משך השירות (דקות)</Label>
            <Input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 15)}
              className="mt-2 w-32 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-slate-400">הצבע של השירות ביומן</Label>
            <input
              type="color"
              value={calendarColor}
              onChange={(e) => setCalendarColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-slate-600 bg-slate-700"
            />
          </div>
          <div>
            <Toggle
              label='להסתיר מקביעת תורים ע"י לקוחות'
              checked={hiddenFromBooking}
              onChange={setHiddenFromBooking}
            />
          </div>
        </CardContent>
        <div className="flex flex-row-reverse items-center justify-between gap-2 p-4 border-t border-slate-700 flex-shrink-0">
          <div className="flex gap-2">
            {!isNew && (
              <Button
                variant="outline"
                onClick={deleteService}
                disabled={saving}
                className="bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50"
              >
                מחיקה
              </Button>
            )}
            <Button onClick={save} disabled={saving || !name.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "שומר..." : isNew ? "הוסף" : "עדכון"}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-white"
          >
            ביטול
          </Button>
        </div>
      </Card>
    </div>
  )
}
