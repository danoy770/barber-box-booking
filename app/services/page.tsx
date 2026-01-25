"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  { id: "all", name: "הכל" },
  { id: "laser", name: "לייזר" },
  { id: "haircuts", name: "תספורות" },
  { id: "extra", name: "שירותים אקסטרה" },
]

const SERVICES = {
  laser: [
    {
      id: "laser-full",
      name: "הסרת שיער בלייזר מלא",
      duration: "15 דק׳",
      price: "30",
      pricePrefix: "החל מ",
      details: "2 אזורים ומעלה",
    },
    {
      id: "laser-area1",
      name: "הסרת שיער בלייזר אזור 1",
      duration: "10 דק׳",
      price: "30",
      pricePrefix: "החל מ",
      details: "איזור אחד בלבד",
    },
  ],
  haircuts: [
    {
      id: "haircut-man-child",
      name: "תספורת גבר/ילד",
      duration: "20 דק׳",
      price: "50",
      pricePrefix: "",
      details: "זקן בתוספת 10/20 ₪ (אם מדורג או לא)",
    },
    {
      id: "haircut-kid-no-fade",
      name: "תספורת ילד ללא דירוג (עד גיל 13)",
      duration: "15 דק׳",
      price: "45",
      pricePrefix: "",
      details: "",
    },
    {
      id: "haircut-graded",
      name: "תספורת מדורג מספר חצי ומטה",
      duration: "20 דק׳",
      price: "60",
      pricePrefix: "",
      details: "תספורת מקצועית עם תדלוק",
    },
    {
      id: "haircut-beard",
      name: "תספורת גבר + זקן",
      duration: "25 דק׳",
      price: "60",
      pricePrefix: "",
      details: "תספורת וטיפול בזקן",
    },
    {
      id: "haircut-avrech",
      name: "תספורת אברך",
      duration: "15 דק׳",
      price: "45",
      pricePrefix: "",
      details: "",
    },
    {
      id: "haircut-avrech-beard",
      name: "תספורת אברך + זקן",
      duration: "20 דק׳",
      price: "55",
      pricePrefix: "",
      details: "",
    },
    {
      id: "haircut-2",
      name: "2 תספורות",
      duration: "40 דק׳",
      price: "100",
      pricePrefix: "",
      details: "",
    },
    {
      id: "haircut-3",
      name: "3 תספורות",
      duration: "50 דק׳",
      price: "150",
      pricePrefix: "",
      details: "",
    },
    {
      id: "haircut-2-kids",
      name: "תספורת 2 ילדים ללא דירוג",
      duration: "25 דק׳",
      price: "90",
      pricePrefix: "",
      details: "",
    },
    {
      id: "haircut-3-kids",
      name: "תספורת 3 ילדים ללא דירוג",
      duration: "35 דק׳",
      price: "135",
      pricePrefix: "",
      details: "",
    },
  ],
  extra: [
    {
      id: "extra-beard",
      name: "סידור זקן או פס",
      duration: "5 דק׳",
      price: "20",
      pricePrefix: "",
      details: "",
    },
    {
      id: "extra-wax",
      name: "שעווה",
      duration: "10 דקות",
      price: "20",
      pricePrefix: "",
      details: "לחיים, עורף, אף/אוזניים",
    },
  ],
}

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const phoneNumber = "058-778-0023"
  const whatsappLink = `https://wa.me/972587780023`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contact Header Card */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <Card className="border-0 rounded-none shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 text-right">
                <p className="text-sm text-gray-700 mb-2">
                  תוכלו לקבוע תור בוואצאפ או בטלפון
                </p>
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
              <a
                href={`tel:${phoneNumber}`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full text-sm">
                  <Phone className="w-4 h-4 ms-2" />
                  התקשר
                </Button>
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  size="sm"
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-sm"
                >
                  <MessageCircle className="w-4 h-4 ms-2" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[138px] sm:top-[136px] z-10">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 sm:px-6 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "bg-slate-800 text-white font-semibold"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Content */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
          בחירת שירותים
        </h2>

        {/* Services List */}
        {activeCategory === "all" ? (
          // Afficher toutes les catégories
          <div className="space-y-8">
            {CATEGORIES.filter((cat) => cat.id !== "all").map((category) => (
              <div key={category.id}>
                {/* Category Title */}
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  {category.name}
                </h3>

                {/* Services List for this category */}
                <div className="space-y-4">
                  {SERVICES[category.id as keyof typeof SERVICES].map((service) => (
                    <Card key={service.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">
                            {service.name}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600">
                            <span>{service.duration}</span>
                            <span className="font-semibold">
                              {service.pricePrefix && (
                                <span className="text-xs me-1">{service.pricePrefix}</span>
                              )}
                              ₪{service.price}
                            </span>
                          </div>
                        </div>
                        {service.details && (
                          <p className="text-sm text-gray-500 mt-2">{service.details}</p>
                        )}
                        <Link href={`/booking?service=${service.id}`} className="block mt-4">
                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
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
          // Afficher une seule catégorie
          <>
            {/* Category Title */}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              {CATEGORIES.find((c) => c.id === activeCategory)?.name}
            </h3>

            {/* Services List */}
            <div className="space-y-4">
              {SERVICES[activeCategory as keyof typeof SERVICES].map((service) => (
                <Card key={service.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex-1">
                        {service.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600">
                        <span>{service.duration}</span>
                        <span className="font-semibold">
                          {service.pricePrefix && (
                            <span className="text-xs mr-1">{service.pricePrefix}</span>
                          )}
                          ₪{service.price}
                        </span>
                      </div>
                    </div>
                    {service.details && (
                      <p className="text-sm text-gray-500 mt-2">{service.details}</p>
                    )}
                    <Link href={`/booking?service=${service.id}`} className="block mt-4">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
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

        {/* Back to Home */}
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
