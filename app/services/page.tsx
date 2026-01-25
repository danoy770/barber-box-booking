"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type ServiceItem = {
  id: number
  name: string
  duration: string
  price: number
  pricePrefix: string
  details: string
}

type CategoryItem = {
  id: number
  name: string
  services: ServiceItem[]
}

const phoneNumber = "058-778-0023"
const whatsappLink = "https://wa.me/972587780023"

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [catRes, srvRes] = await Promise.all([
          supabase.from("categories").select("id, name, sort_order").order("sort_order", { ascending: true }),
          supabase
            .from("services")
            .select("id, category_id, name, notes, price, price_is_min, duration_minutes")
            .eq("hidden_from_booking", false)
            .order("category_id")
            .order("sort_order", { ascending: true }),
        ])
        if (catRes.error || srvRes.error) {
          console.error("fetch services", catRes.error || srvRes.error)
          return
        }
        const cats = (catRes.data ?? []) as { id: number; name: string; sort_order: number }[]
        const srvs = (srvRes.data ?? []) as {
          id: number
          category_id: number
          name: string
          notes: string
          price: number
          price_is_min: boolean
          duration_minutes: number
        }[]
        const built: CategoryItem[] = cats.map((c) => ({
          id: c.id,
          name: c.name,
          services: srvs
            .filter((s) => s.category_id === c.id)
            .map((s) => ({
              id: s.id,
              name: s.name,
              duration: `${s.duration_minutes} דק׳`,
              price: s.price,
              pricePrefix: s.price_is_min ? "החל מ" : "",
              details: s.notes || "",
            })),
        }))
        setCategories(built)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tabs = useMemo(() => {
    const all = { id: "all", name: "הכל" }
    return [all, ...categories.map((c) => ({ id: String(c.id), name: c.name }))]
  }, [categories])

  const currentCategory = activeCategory === "all" ? null : categories.find((c) => String(c.id) === activeCategory)
  const displayedServices = activeCategory === "all"
    ? categories.flatMap((c) => c.services)
    : (currentCategory?.services ?? [])

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <Card className="border-0 rounded-none shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 text-right">
                <p className="text-sm text-gray-700 mb-2">תוכלו לקבוע תור בוואצאפ או בטלפון</p>
                <div className="flex items-center justify-end gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">{phoneNumber}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">מספר</p>
                <p className="text-xs text-gray-500">מחכה לראות אותכם 🙂</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a href={`tel:${phoneNumber}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  <Phone className="w-4 h-4 ms-2" />
                  התקשר
                </Button>
              </a>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-sm">
                  <MessageCircle className="w-4 h-4 ms-2" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-[138px] sm:top-[136px] z-10">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveCategory(t.id)}
                className={`px-4 sm:px-6 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === t.id ? "bg-slate-800 text-white font-semibold" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">בחירת שירותים</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">טוען שירותים...</div>
        ) : activeCategory === "all" ? (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{cat.name}</h3>
                <div className="space-y-4">
                  {cat.services.map((s) => (
                    <Card key={s.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">{s.name}</h4>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600">
                            <span>{s.duration}</span>
                            <span className="font-semibold">
                              {s.pricePrefix && <span className="text-xs me-1">{s.pricePrefix}</span>}₪{s.price}
                            </span>
                          </div>
                        </div>
                        {s.details && <p className="text-sm text-gray-500 mt-2">{s.details}</p>}
                        <Link href={`/booking?service=${s.id}`} className="block mt-4">
                          <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-sm sm:text-base">
                            בחר שירות
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{currentCategory?.name}</h3>
            <div className="space-y-4">
              {displayedServices.map((s) => (
                <Card key={s.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">{s.name}</h4>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600">
                        <span>{s.duration}</span>
                        <span className="font-semibold">
                          {s.pricePrefix && <span className="text-xs me-1">{s.pricePrefix}</span>}₪{s.price}
                        </span>
                      </div>
                    </div>
                    {s.details && <p className="text-sm text-gray-500 mt-2">{s.details}</p>}
                    <Link href={`/booking?service=${s.id}`} className="block mt-4">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-sm sm:text-base">
                        בחר שירות
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 mb-8">
          <Link href="/">
            <Button variant="ghost" className="w-full text-sm sm:text-base">
              <ArrowRight className="w-4 h-4 ms-2" />
              חזרה לעמוד הבית
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
