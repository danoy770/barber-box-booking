"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, Clock, User, Phone, Scissors } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type UserBooking = {
  date: string
  time: string
  services: string[]
  clientName: string
  clientPhone: string
  durationMinutes: number
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [bookingDetails, setBookingDetails] = useState({
    service: "",
    barber: "",
    date: "",
    time: "",
    name: "",
    phone: "",
  })
  const [localStorageBooking, setLocalStorageBooking] = useState<UserBooking | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [autoConfirmTriggered, setAutoConfirmTriggered] = useState(false)

  useEffect(() => {
    if (!searchParams) return

    const serviceNames: { [key: string]: string } = {
      haircut: "תספורת גברים",
      beard: "תספורת זקן",
      "haircut-beard": "תספורת + זקן",
      "laser-full": "הסרת שיער בלייזר מלא",
      "laser-area1": "הסרת שיער בלייזר אזור 1",
      "haircut-man-child": "תספורת גבר/ילד",
      "haircut-graded": "תספורת מדורג",
      "extra-wax": "שעווה",
    }

    const barberNames: { [key: string]: string } = {
      dan: "דן",
      yohan: "יוחנן",
    }

    const formatDate = (dateStr: string) => {
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

    const serviceParam = searchParams.get("service") || ""
    const barberParam = searchParams.get("barber") || ""
    const dateParam = searchParams.get("date") || ""
    const timeParam = searchParams.get("time") || ""
    const nameParam = searchParams.get("name") || ""
    const phoneParam = searchParams.get("phone") || ""

    setBookingDetails({
      service: serviceNames[serviceParam] || serviceParam || "",
      barber: barberNames[barberParam] || barberParam || "",
      date: formatDate(dateParam),
      time: timeParam,
      name: nameParam,
      phone: phoneParam,
    })
  }, [searchParams])

  // Charger les données du localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Supprimer activeBooking pour repartir à zéro
      localStorage.removeItem('activeBooking')
      localStorage.removeItem('lastBookingId')
      console.log('[useEffect] Nettoyage du localStorage - activeBooking et lastBookingId supprimés')
      
      const savedBooking = localStorage.getItem('userBooking')
      if (savedBooking) {
        try {
          const booking: UserBooking = JSON.parse(savedBooking)
          setLocalStorageBooking(booking)
          console.log('[useEffect] Booking chargé depuis localStorage:', booking)
        } catch (error) {
          console.error('Erreur lors du chargement du RDV:', error)
        }
      }
    }
  }, [])

  // Confirmation automatique au chargement de la page
  useEffect(() => {
    if (localStorageBooking && !autoConfirmTriggered && !isConfirmed && !isSubmitting) {
      setAutoConfirmTriggered(true)
      console.log('[useEffect] Déclenchement de la confirmation automatique')
      // eslint-disable-next-line react-hooks/exhaustive-deps
      handleConfirmBooking()
    }
  }, [localStorageBooking, autoConfirmTriggered, isConfirmed, isSubmitting])

  // Fonction pour confirmer et enregistrer le RDV dans Supabase
  const handleConfirmBooking = async () => {
    console.log('[handleConfirmBooking] Début de la fonction')
    
    // Protection anti-double-clic
    if (isSubmitting) {
      console.log('[handleConfirmBooking] Déjà en cours de traitement, abandon')
      return
    }
    
    if (!localStorageBooking) {
      console.error('[handleConfirmBooking] Aucun booking trouvé dans localStorage')
      alert('אין פרטי תור זמינים. אנא נסה שוב.')
      return
    }
    
    console.log('[handleConfirmBooking] Données du booking:', localStorageBooking)
    
    // Vérifier si un booking similaire existe déjà
    try {
      const { data: existingBookings } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_name', localStorageBooking.clientName)
        .eq('client_phone', localStorageBooking.clientPhone)
        .eq('date', localStorageBooking.date)
        .eq('time', localStorageBooking.time)
      
      if (existingBookings && existingBookings.length > 0) {
        console.log('[handleConfirmBooking] Un booking similaire existe déjà:', existingBookings)
        // Utiliser le booking existant au lieu d'en créer un nouveau
        const existingBooking = existingBookings[0]
        setBookingId(existingBooking.id)
        setIsConfirmed(true)
        
        // Sauvegarder dans activeBooking
        if (typeof window !== 'undefined') {
          const activeBooking = {
            id: existingBooking.id,
            date: existingBooking.date,
            time: existingBooking.time,
            service: existingBooking.service_name,
            clientName: existingBooking.client_name,
            clientPhone: existingBooking.client_phone
          }
          localStorage.setItem('activeBooking', JSON.stringify(activeBooking))
          console.log('[handleConfirmBooking] Booking existant utilisé:', activeBooking)
        }
        
        // Rediriger vers la page d'accueil
        setTimeout(() => {
          router.push('/')
        }, 500)
        return
      }
    } catch (checkError) {
      console.error('[handleConfirmBooking] Erreur lors de la vérification des doublons:', checkError)
      // Continuer même en cas d'erreur de vérification
    }
    
    setIsSubmitting(true)
    console.log('[handleConfirmBooking] isSubmitting mis à true')
    
    try {
      // Calculer le nom du service (premier service sélectionné ou tous)
      const serviceName = localStorageBooking.services.length > 0 
        ? localStorageBooking.services.join(', ') 
        : 'שירות לא צוין'
      
      console.log('[handleConfirmBooking] Nom du service calculé:', serviceName)
      
      const dataToInsert = {
        client_name: localStorageBooking.clientName,
        client_phone: localStorageBooking.clientPhone,
        date: localStorageBooking.date,
        time: localStorageBooking.time,
        service_name: serviceName,
        service_duration: localStorageBooking.durationMinutes,
        stylist: 'Dan Cohen'
      }
      
      console.log('[handleConfirmBooking] Données à insérer:', dataToInsert)
      console.log('[handleConfirmBooking] Tentative d\'insertion dans Supabase...')
      console.log('--- ENVOI RÉEL À SUPABASE ---')
      console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([dataToInsert])
        .select()
        .single()
      
      if (error) {
        console.error('[handleConfirmBooking] Erreur Supabase:', error)
        console.error('[handleConfirmBooking] Code:', error.code)
        console.error('[handleConfirmBooking] Message:', error.message)
        console.error('[handleConfirmBooking] Détails:', error.details)
        console.error('[handleConfirmBooking] Hint:', error.hint)
        
        const errorMessage = error.message || error.details || 'בעיה לא ידועה'
        alert(`שגיאה: ${errorMessage}\n\nקוד: ${error.code || 'לא זמין'}`)
      } else {
        console.log('[handleConfirmBooking] Succès! Données insérées:', data)
        console.log('[handleConfirmBooking] ID du RDV:', data?.id)
        
        if (data?.id) {
          setBookingId(data.id)
          setIsConfirmed(true)
          
          // Sauvegarder l'objet complet du rendez-vous dans localStorage
          if (typeof window !== 'undefined') {
            const activeBooking = {
              id: data.id,
              date: localStorageBooking.date,
              time: localStorageBooking.time,
              service: serviceName,
              clientName: localStorageBooking.clientName,
              clientPhone: localStorageBooking.clientPhone
            }
            localStorage.setItem('activeBooking', JSON.stringify(activeBooking))
            localStorage.setItem('lastBookingId', String(data.id))
            console.log('[handleConfirmBooking] Active booking sauvegardé dans localStorage:', activeBooking)
          }
          console.log('[handleConfirmBooking] Booking ID stocké:', data.id)
          
          // Rediriger vers la page d'accueil après succès
          setTimeout(() => {
            router.push('/')
          }, 500)
        } else {
          console.warn('[handleConfirmBooking] Aucun ID retourné dans les données')
        }
        
        console.log('[handleConfirmBooking] Le RDV a été enregistré avec succès')
        // Succès - l'état reste à true pour empêcher les nouveaux clics
      }
    } catch (error: any) {
      console.error('[handleConfirmBooking] Exception capturée:', error)
      console.error('[handleConfirmBooking] Type d\'erreur:', typeof error)
      console.error('[handleConfirmBooking] Stack:', error?.stack)
      
      const errorMessage = error?.message || error?.toString() || 'בעיה לא ידועה'
      alert(`שגיאה: ${errorMessage}`)
    } finally {
      console.log('[handleConfirmBooking] Bloc finally - Remise de isSubmitting à false')
      setIsSubmitting(false)
    }
  }

  // Fonction pour annuler le RDV
  const handleCancelBooking = async () => {
    // Récupérer l'ID depuis l'état ou localStorage
    let idToDelete = bookingId
    
    if (!idToDelete && typeof window !== 'undefined') {
      const savedId = localStorage.getItem('lastBookingId')
      if (savedId) {
        idToDelete = parseInt(savedId, 10)
        setBookingId(idToDelete)
        console.log('[handleCancelBooking] ID récupéré depuis localStorage:', idToDelete)
      }
    }
    
    if (!idToDelete) {
      alert('אין תור זמין לביטול')
      return
    }

    if (!window.confirm('האם אתה בטוח שברצונך לבטל את התור הזה?')) {
      return
    }

    try {
      console.log('[handleCancelBooking] Tentative de suppression du RDV ID:', idToDelete)
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', idToDelete)

      if (error) {
        console.error('[handleCancelBooking] Erreur lors de la suppression:', error)
        alert('אירעה שגיאה בביטול התור. אנא נסה שוב.')
      } else {
        console.log('[handleCancelBooking] RDV annulé avec succès')
        
        // Alerte de succès immédiate
        alert('התור בוטל בהצלחה')
        
        // Supprimer aussi du localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userBooking')
          localStorage.removeItem('lastBookingId')
          localStorage.removeItem('activeBooking')
        }
        
        // Réinitialiser les états
        setBookingId(null)
        setIsConfirmed(false)
        setLocalStorageBooking(null)
        
        // Rediriger vers la page de booking
        window.location.href = '/booking'
      }
    } catch (error: any) {
      console.error('[handleCancelBooking] Exception:', error)
      alert(`אירעה שגיאה: ${error?.message || 'בעיה לא ידועה'}`)
    }
  }

  // Fonction pour générer et télécharger le fichier .ics
  const handleDownloadCalendar = () => {
    if (!localStorageBooking || typeof window === 'undefined') return

    const { date, time } = localStorageBooking

    // Parser la date (format YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes] = time.split(':').map(Number)
    
    // Créer les dates de début et fin
    const startDate = new Date(year, month - 1, day, hours, minutes, 0)
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + 30)

    // Formater les dates au format iCalendar (YYYYMMDDTHHmm00)
    const formatDateForICS = (d: Date): string => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dDay = String(d.getDate()).padStart(2, '0')
      const h = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${y}${m}${dDay}T${h}${min}00`
    }

    const startStr = formatDateForICS(startDate)
    const endStr = formatDateForICS(endDate)

    // Construire le contenu du fichier .ics
    const serviceName = bookingDetails.service || 'תספורת'
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Barber Box//Booking System//HE',
      'BEGIN:VEVENT',
      `SUMMARY:ברבר בוקס - ${serviceName}`,
      `DESCRIPTION:תור אצל דן כהן.\\nשירות: ${serviceName}\\nשם: ${localStorageBooking.clientName}`,
      'LOCATION:ברבר בוקס, בית שמש',
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    // Créer le Blob et télécharger
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'תור.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Afficher un message de chargement pendant la confirmation automatique
  if (isSubmitting && !isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4 flex items-center justify-center">
        <Card className="shadow-lg max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <CardTitle className="text-2xl mb-2">מבצע רישום...</CardTitle>
            <p className="text-muted-foreground">
              אנא המתן, אנו רושמים את התור שלך
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">ההזמנה התקבלה בהצלחה!</CardTitle>
            <p className="text-muted-foreground mt-2">
              תודה על ההזמנה. פרטי התור שלך:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Booking Details */}
            <div className="space-y-3 bg-muted/50 p-6 rounded-lg">
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">שירות</div>
                  <div className="font-semibold">{bookingDetails.service || "-"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">מעצב</div>
                  <div className="font-semibold">Dan Cohen</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">תאריך</div>
                  <div className="font-semibold">{bookingDetails.date || "-"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">שעה</div>
                  <div className="font-semibold">{bookingDetails.time || "-"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">שם</div>
                  <div className="font-semibold">{bookingDetails.name || "-"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">טלפון</div>
                  <div className="font-semibold">{bookingDetails.phone || "-"}</div>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>הערה:</strong> בקרוב תישלח אליך הודעת אישור דרך WhatsApp.
                נא להגיע 5 דקות לפני השעה שנקבעה.
              </p>
            </div>

            {/* Bouton de Confirmation ou Annulation */}
            {localStorageBooking && (
              <div className="pt-2">
                {isConfirmed || bookingId ? (
                  // Bouton rouge pour annuler le RDV (après confirmation)
                  <Button
                    onClick={handleCancelBooking}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-lg"
                  >
                    בטל תור
                  </Button>
                ) : (
                  // Bouton vert pour confirmer le RDV (avant confirmation)
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white me-2 inline-block"></div>
                        טיפול...
                      </>
                    ) : (
                      'אשר את התור'
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Bouton Ajouter au Calendrier */}
            {localStorageBooking && (
              <div className="pt-2">
                <button
                  onClick={handleDownloadCalendar}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  <Calendar className="w-5 h-5" />
                  <span>הוסף ליומן 📅</span>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/booking" className="flex-1">
                <Button variant="outline" className="w-full">
                  חזרה לעמוד הבית
                </Button>
              </Link>
              <Link href="/booking" className="flex-1">
                <Button className="w-full">הזמן תור נוסף</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
