"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, MessageCircle, Check, ArrowRight, Clock, User, Loader2, ArrowLeft, Share2, Navigation, X, ChevronLeft, ChevronRight, Calendar, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

type Service = {
  id: string
  name: string
  price: number
  durationMinutes: number
  durationLabel: string
  description?: string
  hasMinPrice?: boolean
}

type ServiceCategory = {
  id: string
  name: string
  services: Service[]
}

type UserBooking = {
  date: string
  time: string
  services: string[]
  clientName: string
  clientPhone: string
  durationMinutes: number
}

type ActiveBooking = {
  id: number
  date: string
  time: string
  service: string
  clientName: string
  clientPhone: string
}

// Données exactes demandées
const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "laser",
    name: "לייזר",
    services: [
      {
        id: "laser-full",
        name: "הסרת שיער בלייזר מלא",
        price: 30,
        durationMinutes: 15,
        durationLabel: "15 דק'",
        description: "החל מ - 2 אזורים ומעלה",
        hasMinPrice: true,
      },
      {
        id: "laser-area1",
        name: "הסרת שיער בלייזר אזור 1",
        price: 30,
        durationMinutes: 10,
        durationLabel: "10 דק'",
        description: "החל מ - איזור אחד בלבד",
        hasMinPrice: true,
      },
    ],
  },
  {
    id: "haircuts",
    name: "תספורות",
    services: [
      {
        id: "haircut-men-child",
        name: "תספורת גבר/ילד",
        price: 50,
        durationMinutes: 20,
        durationLabel: "20 דק'",
        description: "זקן בתוספת 10/20 ₪",
      },
      {
        id: "haircut-kid-no-fade",
        name: "תספורת ילד ללא דירוג",
        price: 45,
        durationMinutes: 15,
        durationLabel: "15 דק'",
        description: "עד גיל 13",
      },
      {
        id: "haircut-fade-half",
        name: "תספורת מדורג מספר חצי",
        price: 60,
        durationMinutes: 20,
        durationLabel: "20 דק'",
        description: "זקן תוספת 10/20",
      },
      {
        id: "haircut-beard",
        name: "תספורת גבר + זקן",
        price: 60,
        durationMinutes: 25,
        durationLabel: "25 דק'",
        description: "החל מ - תוספת 10₪ למספר חצי ומטה",
        hasMinPrice: true,
      },
      {
        id: "haircut-avrech",
        name: "תספורת אברך",
        price: 45,
        durationMinutes: 15,
        durationLabel: "15 דק'",
      },
      {
        id: "haircut-avrech-beard",
        name: "תספורת אברך + זקן",
        price: 55,
        durationMinutes: 20,
        durationLabel: "20 דק'",
        description: "החל מ - 60₪ עם זקן מדורג",
        hasMinPrice: true,
      },
      {
        id: "haircut-two",
        name: "2 תספורות",
        price: 100,
        durationMinutes: 40,
        durationLabel: "40 דק'",
        description: "החל מ",
        hasMinPrice: true,
      },
      {
        id: "haircut-three",
        name: "3 תספורות",
        price: 150,
        durationMinutes: 45,
        durationLabel: "45 דק'",
        description: "החל מ",
        hasMinPrice: true,
      },
      {
        id: "haircut-two-kids",
        name: "תספורת 2 ילדים ללא דירוג",
        price: 90,
        durationMinutes: 25,
        durationLabel: "25 דק'",
      },
      {
        id: "haircut-three-kids",
        name: "תספורת 3 ילדים ללא דירוג",
        price: 135,
        durationMinutes: 35,
        durationLabel: "35 דק'",
      },
      {
        id: "beard-line",
        name: "סידור זקן או פס",
        price: 20,
        durationMinutes: 10,
        durationLabel: "10 דק'",
        description: "החל מ",
        hasMinPrice: true,
      },
    ],
  },
  {
    id: "extras",
    name: "אקסטרה",
    services: [
      {
        id: "wax",
        name: "שעווה",
        price: 20,
        durationMinutes: 10,
        durationLabel: "10 דק'",
        description: "החל מ",
        hasMinPrice: true,
      },
    ],
  },
]

const phoneNumber = "058-778-0023"
const whatsappLink = "https://wa.me/message/CBWXKL2ADPWPG1"

// Liste de toutes les photos de la galerie
const ALL_PHOTOS = [
  '/image1.jpg',
  '/image2.jpg',
  '/image3.jpg',
  '/image4.jpg',
  '/image5.jpg',
  '/image6.jpg',
  '/image7.jpg',
  '/image8.jpg',
  '/image9.jpg',
]

// Générer les créneaux toutes les 5 minutes (09:00 à 18:00)
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push(timeStr)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

// Convertir une heure "HH:mm" en minutes depuis minuit
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Convertir des minutes depuis minuit en heure "HH:mm"
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Mock booked slots avec durée
const bookedSlots: Array<{ date: string; time: string; durationMinutes: number }> = [
  { date: new Date().toISOString().split("T")[0], time: "10:00", durationMinutes: 20 },
  { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], time: "14:00", durationMinutes: 30 },
]

function formatDateToISO(date: Date) {
  return date.toISOString().split("T")[0]
}

function getDayLabel(date: Date, index: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateCopy = new Date(date)
  dateCopy.setHours(0, 0, 0, 0)
  
  if (index === 0) return "היום"
  if (index === 1) return "מחר"
  
  const days = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
  return `יום ${days[date.getDay()]}`
}

function formatDateHuman(dateStr: string) {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const days = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
    const months = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
    ]
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
  } catch {
    return dateStr
  }
}

export default function BookingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"services" | "calendar" | "client">("services")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [appointments, setAppointments] = useState<Array<{ date: string; time: string; service_duration: number }>>([])
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null)

  const serviceMap = useMemo(() => {
    const map: Record<string, Service> = {}
    SERVICE_CATEGORIES.forEach((cat) => {
      cat.services.forEach((s) => {
        map[s.id] = s
      })
    })
    return map
  }, [])

  const displayedServices = useMemo(() => {
    if (!selectedCategory) return SERVICE_CATEGORIES.flatMap((cat) => cat.services)
    const category = SERVICE_CATEGORIES.find((cat) => cat.id === selectedCategory)
    return category ? category.services : []
  }, [selectedCategory])

  const totalPrice = selectedServices.reduce((sum, id) => sum + (serviceMap[id]?.price ?? 0), 0)

  // Générer les 14 prochains jours
  const availableDates = useMemo(() => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [])

  // Créneaux filtrés selon la date sélectionnée (exclut les créneaux passés si c'est aujourd'hui)
  const filteredTimeSlots = useMemo(() => {
    if (!selectedDate) return TIME_SLOTS

    // Vérifier si la date sélectionnée est aujourd'hui
    const today = new Date()
    const selectedDateObj = new Date(selectedDate)
    
    const isToday = 
      today.getFullYear() === selectedDateObj.getFullYear() &&
      today.getMonth() === selectedDateObj.getMonth() &&
      today.getDate() === selectedDateObj.getDate()

    if (!isToday) {
      // Si ce n'est pas aujourd'hui, retourner tous les créneaux
      return TIME_SLOTS
    }

    // Si c'est aujourd'hui, filtrer les créneaux passés
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    return TIME_SLOTS.filter((time) => {
      const slotTimeInMinutes = timeToMinutes(time)
      // Garder uniquement les créneaux strictement dans le futur
      return slotTimeInMinutes > currentTimeInMinutes
    })
  }, [selectedDate])

  // Vérifier si un créneau est disponible en tenant compte de la durée du service
  const isSlotAvailable = (date: string, time: string, serviceDurationMinutes: number) => {
    // Convertir le créneau demandé en minutes
    const slotStart = timeToMinutes(time)
    const slotEnd = slotStart + serviceDurationMinutes

    // Utiliser les appointments chargés depuis Supabase
    // Ajouter aussi les bookedSlots mock pour les tests
    const mockBookings = bookedSlots.map(slot => ({
      date: slot.date,
      time: slot.time,
      service_duration: slot.durationMinutes,
    }))

    const allReservations = [...appointments, ...mockBookings]

    // Vérifier si le créneau chevauche avec un créneau réservé
    return !allReservations.some((booking) => {
      // Comparer les dates au format 'YYYY-MM-DD'
      if (booking.date !== date) return false
      
      // Convertir les heures du RDV existant en minutes
      const bookedStart = timeToMinutes(booking.time)
      const bookedEnd = bookedStart + booking.service_duration
      
      // Règle de collision : Si (NouveauDepart < AncienFin) ET (NouveauFin > AncienDepart), alors BLOQUE
      const hasCollision = (slotStart < bookedEnd) && (slotEnd > bookedStart)
      
      return hasCollision
    })
  }


  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const exists = prev.includes(serviceId)
      return exists ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    })
  }

  const handleContinueFromServices = () => {
    if (selectedServices.length === 0) return
    setCurrentStep("calendar")
  }

  const handleContinueFromCalendar = () => {
    if (!selectedDate || !selectedTime) return
    setCurrentStep("client")
  }

  const handleConfirmBooking = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return
    
    // Validation stricte du numéro de téléphone
    const cleanedPhone = clientPhone.replace(/\D/g, '') // Enlève tout sauf les chiffres
    if (cleanedPhone.length !== 10) {
      if (typeof window !== 'undefined') {
        alert('נא להזין מספר טלפון תקין - 10 ספרות')
      }
      return
    }
    
    setIsSubmitting(true)
    
    // Simuler l'envoi
    console.log("Envoi de la réservation:", {
      services: selectedServices,
      date: selectedDate,
      time: selectedTime,
      clientName,
      clientPhone: cleanedPhone,
    })
    
    // Sauvegarder le RDV dans localStorage
    if (selectedDate && selectedTime && typeof window !== 'undefined') {
      // Calculer la durée totale des services sélectionnés
      const totalDuration = selectedServices.reduce((sum, serviceId) => {
        const service = serviceMap[serviceId]
        return sum + (service?.durationMinutes || 0)
      }, 0)

      const booking: UserBooking = {
        date: selectedDate,
        time: selectedTime,
        services: selectedServices,
        clientName: clientName.trim(),
        clientPhone: cleanedPhone,
        durationMinutes: totalDuration,
      }
      
      // Sauvegarder le dernier RDV (pour l'affichage)
      localStorage.setItem('userBooking', JSON.stringify(booking))
      
      // L'enregistrement dans Supabase se fera dans la page de confirmation
    }
    
    // Petit délai pour l'animation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // Rediriger vers la confirmation
    router.push(
      `/booking/confirmation?${new URLSearchParams({
        service: selectedServices.join(","),
        date: selectedDate || "",
        time: selectedTime || "",
        name: clientName,
        phone: cleanedPhone,
      }).toString()}`
    )
  }

  // Fonctions pour la galerie lightbox
  const openGallery = (index: number = 0) => {
    setCurrentPhotoIndex(index)
    setIsGalleryOpen(true)
  }

  const closeGallery = () => {
    setIsGalleryOpen(false)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % ALL_PHOTOS.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length)
  }

  // Gestion des touches clavier pour la galerie
  useEffect(() => {
    if (!isGalleryOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGalleryOpen(false)
      } else if (e.key === 'ArrowLeft') {
        setCurrentPhotoIndex((prev) => (prev - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length)
      } else if (e.key === 'ArrowRight') {
        setCurrentPhotoIndex((prev) => (prev + 1) % ALL_PHOTOS.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGalleryOpen])

  // Réinitialiser le créneau sélectionné s'il devient indisponible après filtrage
  useEffect(() => {
    if (!selectedDate || !selectedTime) return

    if (!filteredTimeSlots.includes(selectedTime)) {
      setSelectedTime(null)
    }
  }, [selectedDate, selectedTime, filteredTimeSlots])

  // Scroll automatique vers le haut lors du changement d'étape
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])


  // Charger les appointments depuis Supabase
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const { data, error } = await supabase.from('appointments').select('*')
        if (error) {
          console.error('Erreur lors du chargement des appointments:', error)
          return
        }
        if (data) {
          // Transformer les données Supabase en format attendu
          const formattedAppointments = data.map((apt: any) => ({
            date: apt.date,
            time: apt.time,
            service_duration: apt.service_duration || 30,
          }))
          setAppointments(formattedAppointments)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des appointments:', error)
      }
    }
    loadAppointments()
  }, [])

  // Charger le booking actif depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBooking = localStorage.getItem('activeBooking')
      if (savedBooking) {
        try {
          const booking: ActiveBooking = JSON.parse(savedBooking)
          setActiveBooking(booking)
        } catch (error) {
          console.error('Erreur lors du chargement du booking actif:', error)
        }
      }
    }
  }, [])

  // Fonction pour formater la date en hébreu
  const formatDateHebrew = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      const days = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
      const months = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ]
      return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
    } catch {
      return dateStr
    }
  }

  // Fonction pour annuler le RDV
  const handleCancelBooking = async () => {
    if (!activeBooking) return

    if (!window.confirm('האם אתה בטוח שברצונך לבטל את התור הזה?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', activeBooking.id)

      if (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('אירעה שגיאה בביטול התור. אנא נסה שוב.')
      } else {
        // Supprimer du localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('activeBooking')
        }
        setActiveBooking(null)
        alert('התור בוטל בהצלחה')
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error)
      alert(`אירעה שגיאה: ${error?.message || 'בעיה לא ידועה'}`)
    }
  }

  // Étape 2 : Calendrier
  if (currentStep === "calendar") {
    const selectedService = selectedServices[0] ? serviceMap[selectedServices[0]] : null
    
    return (
      <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
        {/* Récapitulatif + Bouton Retour */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep("services")}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm font-medium">חזרה</span>
              </button>
              {selectedService && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{selectedService.name}</span>
                  <span className="mx-2">•</span>
                  <span className="font-bold">₪{selectedService.price}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sélecteur de Date Horizontal */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availableDates.map((date, index) => {
                const dateStr = formatDateToISO(date)
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl transition-all",
                      isSelected
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <span className="text-xs font-medium mb-1">{getDayLabel(date, index)}</span>
                    <span className="text-lg font-bold">{date.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Grille des Heures */}
        <main className="max-w-2xl mx-auto px-4 py-6">
          {selectedDate ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 text-right mb-4">בחר שעה</h2>
              {selectedService && (
                <p className="text-sm text-gray-600 text-right mb-4">
                  משך השירות: {selectedService.durationMinutes} דקות
                </p>
              )}
              {filteredTimeSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">אין זמנים זמינים היום. אנא בחר תאריך אחר.</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {filteredTimeSlots
                      .filter((time) => {
                        const serviceDuration = selectedService?.durationMinutes || 20
                        return isSlotAvailable(selectedDate, time, serviceDuration)
                      })
                      .map((time) => {
                        const isSelected = selectedTime === time
                        return (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "py-4 px-4 rounded-lg text-base font-medium transition",
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            {time}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm">בחר תאריך כדי לראות את השעות הזמינות</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Button
              onClick={handleContinueFromCalendar}
              disabled={!selectedDate || !selectedTime}
              className={cn(
                "w-full h-12 text-lg font-semibold transition",
                selectedDate && selectedTime
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              המשך
            </Button>
          </div>
        </footer>
      </div>
    )
  }

  // Étape 3 : Formulaire Client
  if (currentStep === "client") {
    const selectedService = selectedServices[0] ? serviceMap[selectedServices[0]] : null
    // Validation stricte : le numéro doit contenir exactement 10 chiffres
    const cleanedPhone = clientPhone.replace(/\D/g, '')
    const isPhoneValid = cleanedPhone.length === 10
    const canSubmit = clientName.trim().length > 0 && isPhoneValid

    return (
      <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
        {/* Récapitulatif + Bouton Retour */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep("calendar")}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm font-medium">חזרה</span>
              </button>
            </div>
          </div>
        </div>

        {/* Récapitulatif RDV */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-right">
              <h3 className="font-semibold text-gray-900 mb-2">סיכום התור</h3>
              {selectedService && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">שירות:</span> {selectedService.name}
                </p>
              )}
              {selectedDate && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">תאריך:</span> {formatDateHuman(selectedDate)}
                </p>
              )}
              {selectedTime && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">שעה:</span> {selectedTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire Client */}
        <main className="max-w-2xl mx-auto px-4 py-8 pb-40">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-right mb-6">פרטי יצירת קשר</h2>
              
              {/* Champ Prénom */}
              <div className="space-y-2 mb-4">
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 text-right">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  id="clientName"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="הזן את שמך המלא"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: "16px" }} // Évite le zoom sur iPhone
                />
              </div>

              {/* Champ Téléphone */}
              <div className="space-y-2">
                <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 text-right">
                  מספר טלפון <span className="text-red-500">*</span>
                </label>
                <input
                  id="clientPhone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => {
                    // Ne garder que les chiffres
                    const value = e.target.value.replace(/\D/g, "")
                    setClientPhone(value)
                  }}
                  placeholder="050-123-4567"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: "16px" }} // Évite le zoom sur iPhone
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer avec Bouton Confirmer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Button
              onClick={handleConfirmBooking}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "w-full h-12 text-lg font-semibold transition flex items-center justify-center gap-2",
                canSubmit && !isSubmitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>שולח...</span>
                </>
              ) : (
                "אשר את התור"
              )}
            </Button>
          </div>
        </footer>
      </div>
    )
  }

  // Étape 1 : Services
  return (
    <div className="min-h-screen bg-gray-100 font-sans" dir="rtl">
      {/* Bannière avec Image de Fond */}
      <div
        className="relative h-64 w-full bg-cover bg-center bg-no-repeat bg-gradient-to-br from-gray-800 to-gray-900"
        style={{ backgroundImage: "url('/cover.jpg')" }}
      >
        {/* Boutons de Navigation en Haut */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition">
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Logo Centré Superposé en Bas */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
          <img src="/logo.jpeg" alt="לוגו ברבר בוקס" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Informations et Actions */}
      <section className="pt-24 pb-8 px-4 text-center bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dan Cohen ספר גברים</h1>
        <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-6">
          <MapPin className="w-4 h-4" />
          <span>יחזקאל הנביא 31, בית שמש</span>
        </div>
        
        {/* Boutons d'Action */}
        <div className="flex justify-center gap-4 mt-6">
          <a
            href="waze://?q=Barber%20Box%20Beit%20Shemesh&navigate=yes"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
          >
            <Navigation className="w-5 h-5 text-gray-700" />
          </a>
          <a
            href={`tel:${phoneNumber}`}
            className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
          >
            <Phone className="w-5 h-5 text-gray-700" />
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20BA5A] flex items-center justify-center transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </a>
        </div>
      </section>

      {/* Carte de Notification - Mon Rendez-vous */}
      {activeBooking && (
        <section className="px-4 mt-6">
          <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>תור קרוב</span>
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">תאריך:</span> {formatDateHebrew(activeBooking.date)}
                    </p>
                    <p>
                      <span className="font-medium">שעה:</span> {activeBooking.time}
                    </p>
                    <p>
                      <span className="font-medium">שירות:</span> {activeBooking.service}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
              >
                בטל תור
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Galerie Photos */}
      <section className="px-4 mt-6">
        <div className="grid grid-cols-3 gap-2 h-48 rounded-xl overflow-hidden">
          {/* Grande image à droite */}
          <div 
            className="col-span-2 h-full bg-gray-200 bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity" 
            style={{ backgroundImage: `url('${ALL_PHOTOS[0]}')` }}
            onClick={() => openGallery(0)}
          ></div>
          
          {/* Colonne à gauche avec deux images */}
          <div className="flex flex-col gap-2">
            <div 
              className="h-[calc(50%-4px)] bg-gray-300 bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity" 
              style={{ backgroundImage: `url('${ALL_PHOTOS[1]}')` }}
              onClick={() => openGallery(1)}
            ></div>
            <div 
              className="h-[calc(50%-4px)] bg-gray-300 bg-cover bg-center relative cursor-pointer hover:opacity-90 transition-opacity" 
              style={{ backgroundImage: `url('${ALL_PHOTOS[2]}')` }}
              onClick={() => openGallery(2)}
            >
              {/* Compteur avec nombre de photos restantes */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1">
                <span className="text-white font-bold text-lg">+{ALL_PHOTOS.length - 3}</span>
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section À Propos */}
      <section className="px-4 mt-4">
        <h2 className="text-xl font-bold text-gray-900 text-right mb-4 px-4">אודות</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 mx-4 mt-4 text-right text-gray-700">
          <p className="leading-relaxed">
            רוצים להסתפר בלי להמתין שעות בתור, הגעתם למספרה הנכונה. כאן דואגים להוציא את ה 100% של השיער שלכם.
          </p>
        </div>
      </section>

      {/* Barre catégories sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 mt-6">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition",
                selectedCategory === null
                  ? "bg-slate-900 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              )}
            >
              הכל
            </button>
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition",
                  selectedCategory === category.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste services */}
      <main className="max-w-2xl mx-auto px-4 py-6 bg-gray-100">
        <div className="space-y-3 mb-24">
          {displayedServices.map((service) => {
            const isSelected = selectedServices.includes(service.id)
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "w-full bg-white p-4 rounded-xl shadow-sm border text-right transition-all",
                  isSelected
                    ? "border-blue-500 border-2 shadow-md"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col items-end flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-lg">{service.name}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    {service.description && (
                      <span className="text-sm text-gray-600 mb-1">{service.description}</span>
                    )}
                    <span className="text-xs text-gray-500">{service.durationLabel}</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-1">
                      {service.hasMinPrice && <span className="text-xs text-gray-500">החל מ</span>}
                      <span className="text-2xl font-bold text-gray-900">₪{service.price}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{selectedServices.length}</span> שירותים נבחרו
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">סה\"כ</div>
              <div className="text-2xl font-bold text-gray-900">₪{totalPrice}</div>
            </div>
          </div>
          <Button
            onClick={handleContinueFromServices}
            disabled={selectedServices.length === 0}
            className={cn(
              "w-full h-12 text-lg font-semibold transition",
              selectedServices.length > 0
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            המשך
          </Button>
        </div>
      </footer>

      {/* Lightbox Galerie */}
      {isGalleryOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeGallery}
        >
          {/* Bouton Fermer */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition z-10"
            aria-label="סגור"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Bouton Précédent */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              prevPhoto()
            }}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition z-10"
            aria-label="תמונה קודמת"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Image Centrale */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              nextPhoto()
            }}
          >
            <img
              src={ALL_PHOTOS[currentPhotoIndex]}
              alt={`תמונה ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-pointer"
            />
          </div>

          {/* Bouton Suivant */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              nextPhoto()
            }}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition z-10"
            aria-label="תמונה הבאה"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Indicateur de position */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
            {currentPhotoIndex + 1} / {ALL_PHOTOS.length}
          </div>
        </div>
      )}
    </div>
  )
}
