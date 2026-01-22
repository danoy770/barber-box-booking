"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Trash2, Phone, CalendarDays, Plus, X, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Type pour les rendez-vous
type Appointment = {
  id: number
  client_name: string
  client_phone: string
  service_name: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
}

// Liste des services disponibles
const SERVICES = [
  "תספורת גבר/ילד",
  "תספורת ילד ללא דירוג (עד גיל 13)",
  "תספורת מדורג מספר חצי ומטה",
  "תספורת גבר + זקן",
  "תספורת אברך",
  "תספורת אברך + זקן",
  "2 תספורות",
  "3 תספורות",
  "תספורת 2 ילדים ללא דירוג",
  "תספורת 3 ילדים ללא דירוג",
  "סידור זקן או פס",
  "הסרת שיער בלייזר מלא",
  "הסרת שיער בלייזר אזור 1",
  "תספורת ראשונה לילד (חלאקה)",
  "תספורת עד הבית",
  "שעווה",
  "תספורת פרימיום",
  "טיפול פנים + תספורת"
]

// Fonction pour formater la date en hébreu (parse en local pour éviter les décalages UTC)
function formatDateHuman(dateStr: string) {
  if (!dateStr) return ""
  try {
    // Parser la date en local (évite les décalages UTC)
    // Si format YYYY-MM-DD, créer la date en local
    let d: Date
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number)
      d = new Date(year, month - 1, day) // Les mois sont 0-indexés
    } else {
      d = new Date(dateStr)
    }
    
    if (isNaN(d.getTime())) return dateStr
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
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
  } catch {
    return dateStr
  }
}

// Fonction pour obtenir la date locale au format YYYY-MM-DD (sans décalage UTC)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Fonction pour obtenir le nom du jour en hébreu
function getDayName(date: Date): string {
  const days = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
  return days[date.getDay()]
}

// Fonction pour générer les 7 prochains jours (commence par aujourd'hui en date locale)
function getNext7Days(): Array<{ date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }> {
  const days = []
  const today = new Date()
  // Utiliser la date locale (heure locale, pas UTC)
  today.setHours(0, 0, 0, 0)
  
  // Obtenir la date d'aujourd'hui en format local
  const todayLocalStr = getLocalDateString(today)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = getLocalDateString(date) // Utiliser la date locale, pas UTC
    const isToday = dateStr === todayLocalStr
    
    days.push({
      date,
      dateStr,
      dayName: getDayName(date),
      dayNumber: date.getDate(),
      isToday
    })
  }
  
  return days
}

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Initialiser avec la date locale d'aujourd'hui (pas UTC)
  const getTodayLocal = () => {
    const today = new Date()
    return getLocalDateString(today)
  }
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocal()) // Format YYYY-MM-DD (date locale)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    date: getTodayLocal(),
    hour: '08',
    minute: '00',
    service: '',
    clientName: '',
    clientPhone: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [currentTime, setCurrentTime] = useState(new Date())

  // Charger les appointments depuis Supabase
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('id, client_name, client_phone, service_name, date, time')
          .order('date', { ascending: true })
          .order('time', { ascending: true })

        if (error) {
          console.error('Erreur lors du chargement des appointments:', error)
          alert('אירעה שגיאה בטעינת התורים')
          return
        }

        if (data) {
          setAppointments(data as Appointment[])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des appointments:', error)
        alert('אירעה שגיאה בטעינת התורים')
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [])

  // Synchroniser la date du formulaire avec la date sélectionnée
  useEffect(() => {
    setNewAppointment(prev => ({ ...prev, date: selectedDate, hour: '08', minute: '00' }))
  }, [selectedDate])

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      if (selectedAppointment) {
        setSelectedAppointment(null)
      }
    }
    if (selectedAppointment) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [selectedAppointment])

  // Arrondir une heure à l'intervalle de 5 minutes le plus proche
  const roundToNearest5Minutes = (timeStr: string): { hour: string; minute: string } => {
    if (!timeStr) return { hour: '08', minute: '00' }
    const [hours, minutes] = timeStr.split(':').map(Number)
    const roundedMinutes = Math.round(minutes / 5) * 5
    let finalHour = hours
    let finalMinute = roundedMinutes
    
    if (roundedMinutes >= 60) {
      finalHour = hours + 1
      finalMinute = 0
    }
    
    return {
      hour: finalHour.toString().padStart(2, '0'),
      minute: finalMinute.toString().padStart(2, '0')
    }
  }

  // Fonction pour enregistrer un nouveau rendez-vous
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Combiner hour et minute en time
    const time = `${newAppointment.hour}:${newAppointment.minute}`
    
    if (!time || !newAppointment.service || !newAppointment.clientName || !newAppointment.clientPhone) {
      alert('נא למלא את כל השדות')
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          client_name: newAppointment.clientName,
          client_phone: newAppointment.clientPhone,
          service_name: newAppointment.service,
          date: newAppointment.date,
          time: time,
          stylist: 'Dan Cohen',
          service_duration: 30 // Durée par défaut, peut être ajustée
        }])
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de l\'enregistrement:', error)
        alert('אירעה שגיאה בשמירת התור')
      } else {
        // Rafraîchir la liste des appointments
        const { data: allData, error: loadError } = await supabase
          .from('appointments')
          .select('id, client_name, client_phone, service_name, date, time')
          .order('date', { ascending: true })
          .order('time', { ascending: true })

        if (!loadError && allData) {
          setAppointments(allData as Appointment[])
        }

        // Réinitialiser le formulaire et fermer le modal
        setNewAppointment({
          date: selectedDate,
          hour: '08',
          minute: '00',
          service: '',
          clientName: '',
          clientPhone: ''
        })
        setIsModalOpen(false)
        alert('התור נשמר בהצלחה')
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      alert('אירעה שגיאה בשמירת התור')
    } finally {
      setIsSaving(false)
    }
  }

  // Constantes pour l'échelle de la grille
  const HOUR_HEIGHT = 150 // Hauteur fixe par heure en pixels
  const START_HOUR = 8 // Heure de début (8:00)
  const END_HOUR = 20 // Heure de fin (20:00)
  const TOTAL_HOURS = END_HOUR - START_HOUR // 12 heures
  const GRID_TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT // Hauteur totale de la grille

  // Mettre à jour l'heure actuelle chaque minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Mettre à jour chaque minute
    
    return () => clearInterval(timer)
  }, [])

  // Générer les heures de la journée (8h à 20h)
  const generateTimeSlots = () => {
    const hours = []
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return hours
  }

  // Convertir une heure (HH:mm) en minutes depuis minuit
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Convertir une heure (HH:mm) en position verticale en pixels
  const timeToPositionPx = (timeStr: string): number => {
    const totalMinutes = timeToMinutes(timeStr)
    const startMinutes = START_HOUR * 60 // 8:00
    const minutesFromStart = totalMinutes - startMinutes
    // Convertir les minutes en pixels : (minutes / 60) * HOUR_HEIGHT
    return (minutesFromStart / 60) * HOUR_HEIGHT
  }

  // Calculer l'heure de fin d'un rendez-vous
  const calculateEndTime = (startTime: string, durationMinutes: number = 30): string => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + durationMinutes
    const hours = Math.floor(endMinutes / 60)
    const minutes = endMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Calculer la hauteur d'un rendez-vous en pixels (basé sur la durée)
  const calculateAppointmentHeightPx = (durationMinutes: number = 30): number => {
    // Hauteur = (durée en minutes / 60) * HOUR_HEIGHT
    // Exemple: 30 min = 0.5 * 150 = 75px
    const heightPx = (durationMinutes / 60) * HOUR_HEIGHT
    // Hauteur minimale de 50px pour garantir la lisibilité
    return Math.max(50, heightPx)
  }

  // Calculer les positions des rendez-vous (empilement vertical avec pixels)
  const calculateAppointmentLayout = (appointments: Appointment[]) => {
    // Convertir les rendez-vous en objets avec positions calculées en pixels
    const aptsWithPositions = appointments.map(apt => {
      const startMinutes = timeToMinutes(apt.time)
      const durationMinutes = 30 // Durée par défaut, peut être ajustée si disponible dans les données
      const endMinutes = startMinutes + durationMinutes
      const endTime = calculateEndTime(apt.time, durationMinutes)
      const topPx = timeToPositionPx(apt.time)
      const heightPx = calculateAppointmentHeightPx(durationMinutes)
      
      return {
        ...apt,
        startMinutes,
        endMinutes,
        endTime,
        topPx,
        heightPx
      }
    })

    // Trier par heure de début
    aptsWithPositions.sort((a, b) => a.startMinutes - b.startMinutes)

    return aptsWithPositions
  }

  // Obtenir la position de la ligne "Maintenant" en pixels si c'est aujourd'hui
  const getCurrentTimePositionPx = (): number | null => {
    const todayStr = getLocalDateString(new Date())
    if (selectedDate === todayStr) {
      const hours = currentTime.getHours()
      const minutes = currentTime.getMinutes()
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      return timeToPositionPx(timeStr)
    }
    return null
  }

  // Gérer le clic sur un bloc de rendez-vous
  const handleAppointmentClick = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation()
    setSelectedAppointment(apt)
    // Ajuster la position pour que le menu ne sorte pas de l'écran
    const menuWidth = 200
    const menuHeight = 150
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10)
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10)
    setMenuPosition({ x: Math.max(10, x), y: Math.max(10, y) })
  }

  // Fermer le menu
  const closeMenu = () => {
    setSelectedAppointment(null)
  }

  // Fonction pour convertir un numéro israélien au format international pour WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Retirer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '')
    
    // Si le numéro commence par 0, le remplacer par +972
    if (cleaned.startsWith('0')) {
      return `+972${cleaned.substring(1)}`
    }
    
    // Si le numéro commence déjà par 972, ajouter le +
    if (cleaned.startsWith('972')) {
      return `+${cleaned}`
    }
    
    // Si le numéro commence par +972, le retourner tel quel
    if (cleaned.startsWith('+972')) {
      return cleaned
    }
    
    // Par défaut, ajouter +972
    return `+972${cleaned}`
  }

  // Fonction de suppression (indépendante du localStorage client)
  const handleDelete = async (id: number, clientName: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את התור של ${clientName}?`)) {
      return
    }

    try {
      // Supprimer uniquement de Supabase - AUCUNE interaction avec localStorage
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) {
        alert('אירעה שגיאה במחיקת התור')
        console.error('Erreur Supabase:', error)
      } else {
        // Mettre à jour l'affichage localement seulement si Supabase a validé
        setAppointments(prev => prev.filter(appt => appt.id !== id))
        alert('התור נמחק בהצלחה')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('אירעה שגיאה במחיקת התור')
    }
  }

  // Fonction pour normaliser une date au format YYYY-MM-DD (gère les dates UTC et locales)
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return ''
    // Si la date contient un T (format ISO), extraire uniquement la partie date
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    // Sinon, retourner tel quel (déjà au format YYYY-MM-DD)
    return dateStr
  }

  // Filtrer et trier les rendez-vous par date sélectionnée (comparaison normalisée)
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.date)
    const selectedDateNormalized = normalizeDate(selectedDate)
    return aptDate === selectedDateNormalized
  })
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return a.time.localeCompare(b.time)
  })

  // Fonction pour revenir à aujourd'hui (utilise la date locale)
  const handleBackToToday = () => {
    const today = new Date()
    setSelectedDate(getLocalDateString(today))
  }

  // Fonction pour gérer le sélecteur de date
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value)
    }
  }

  // Générer les 7 prochains jours
  const next7Days = getNext7Days()

  // Si non authentifié, afficher le formulaire de connexion
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full overflow-x-hidden">
      <div className="w-full py-2 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between px-3">
          <div>
            <h1 className="text-2xl font-bold text-white">ניהול תורים</h1>
            <p className="text-xs text-slate-400 mt-1">Barber Box</p>
          </div>
        </div>

        {/* Barre de navigation des jours - Agrandie pour mobile */}
        <Card className="shadow-lg bg-slate-800 border-slate-700 mx-0">
          <CardContent className="py-3 px-2">
            <div className="flex items-center justify-between gap-2" dir="rtl">
              {/* Barre de jours horizontale - Boutons tactiles agrandis */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {next7Days.map((day) => {
                  const isSelected = day.dateStr === selectedDate
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`
                        relative flex flex-col items-center justify-center min-w-[70px] h-20 px-4 rounded-xl transition-all touch-manipulation
                        ${isSelected 
                          ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400 scale-105' 
                          : 'bg-slate-700 text-slate-300 active:bg-slate-600 border border-slate-600'
                        }
                        ${day.isToday && !isSelected ? 'border-2 border-blue-500' : ''}
                      `}
                    >
                      <span className="text-sm font-medium">{day.dayName}</span>
                      <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-white'}`}>
                        {day.dayNumber}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Sélecteur de calendrier - Agrandi pour mobile */}
              <div className="relative">
                <label htmlFor="date-picker" className="cursor-pointer touch-manipulation">
                  <div className="w-14 h-14 rounded-xl bg-slate-700 border border-slate-600 active:bg-slate-600 flex items-center justify-center transition-colors shadow-sm">
                    <CalendarDays className="w-6 h-6 text-slate-300" />
                  </div>
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={handleDatePickerChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vue Agenda (Time Grid) */}
        <Card className="shadow-lg bg-slate-800 border-slate-700 mx-0">
          <CardHeader className="px-3 py-2">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Calendar className="w-4 h-4" />
              תורים ל-{formatDateHuman(selectedDate)} ({sortedAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p className="text-slate-400">טוען תורים...</p>
              </div>
            ) : (
              <div className="relative w-full" dir="rtl">
                {/* Conteneur principal de l'agenda - Scroll fluide avec inertie */}
                <div 
                  className="relative bg-slate-900 overflow-y-auto touch-pan-y w-full"
                  style={{ 
                    maxHeight: 'calc(100vh - 220px)',
                    minHeight: '400px',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth'
                  }}
                >
                  <div className="relative w-full" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                  {/* Lignes horizontales pour chaque heure */}
                  {generateTimeSlots().map((time, index) => (
                    <div
                      key={time}
                      className="absolute left-0 right-12 border-t border-slate-700/30"
                      style={{ top: `${index * HOUR_HEIGHT}px` }}
                    ></div>
                  ))}

                  {/* Colonne des heures à droite (réduite pour mobile) - Collée au bord */}
                  <div className="absolute right-0 top-0 bottom-0 w-12 border-l border-slate-700 z-10 bg-slate-800/50">
                    {generateTimeSlots().map((time, index) => (
                      <div
                        key={time}
                        className="absolute right-0 w-full flex items-center justify-end pr-1"
                        style={{ top: `${index * HOUR_HEIGHT}px` }}
                      >
                        <span className="text-[10px] text-slate-400 font-medium">{time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Zone des rendez-vous - Largeur 100% jusqu'au bord gauche */}
                  <div className="pr-12 relative w-full" style={{ height: `${GRID_TOTAL_HEIGHT}px` }}>
                    {/* Ligne "Maintenant" */}
                    {getCurrentTimePositionPx() !== null && (
                      <div
                        className="absolute left-0 right-12 border-t-2 border-white z-20 flex items-center gap-2"
                        style={{ top: `${getCurrentTimePositionPx()}px` }}
                      >
                        <div className="w-3 h-3 rounded-full bg-white ml-2"></div>
                        <span className="text-[10px] text-white font-medium bg-slate-800 px-2 py-1 rounded">
                          עכשיו {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Blocs de rendez-vous - Optimisés pour mobile */}
                    {(() => {
                      const appointmentsWithLayout = calculateAppointmentLayout(sortedAppointments)
                      
                      return appointmentsWithLayout.map((apt) => {
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => handleAppointmentClick(e, apt)}
                            className="absolute left-0 right-12 bg-sky-50 active:bg-sky-100 text-gray-900 cursor-pointer transition-all z-30 flex items-center rounded-lg shadow-sm touch-manipulation"
                            style={{
                              top: `${apt.topPx}px`,
                              height: `${apt.heightPx}px`,
                              minHeight: '60px',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              borderLeft: '4px solid #0ea5e9',
                              padding: '10px 8px'
                            }}
                            dir="rtl"
                          >
                            {/* Contenu simplifié pour mobile - Priorité: Heure, Nom, Service */}
                            <div className="flex flex-col gap-1 w-full text-right">
                              {/* Ligne 1: Heure en gras */}
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                <span className="font-bold text-sm text-gray-900">
                                  {apt.time} - {apt.endTime}
                                </span>
                              </div>
                              {/* Ligne 2: Nom du client */}
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-gray-700 flex-shrink-0" />
                                <span className="font-semibold text-sm text-gray-900">
                                  {apt.client_name}
                                </span>
                              </div>
                              {/* Ligne 3: Service (plus petit) */}
                              <div className="text-xs text-gray-700 pr-5">
                                {apt.service_name}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}

                    {/* Message si aucun rendez-vous */}
                    {sortedAppointments.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-slate-400 text-lg">אין תורים ליום זה</p>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Menu contextuel */}
                {selectedAppointment && (
                  <>
                    {/* Overlay pour fermer le menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={closeMenu}
                    ></div>
                    {/* Menu */}
                    <div
                      className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 min-w-[200px]"
                      style={{
                        left: `${menuPosition.x}px`,
                        top: `${menuPosition.y}px`,
                        transform: 'translateX(-100%)' // Aligner à gauche du clic (RTL)
                      }}
                      dir="rtl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-1">
                        {/* Bouton WhatsApp */}
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(selectedAppointment.client_phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeMenu}
                          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          <span>WhatsApp</span>
                        </a>
                        {/* Bouton Appel */}
                        <a
                          href={`tel:${selectedAppointment.client_phone.replace(/\D/g, '')}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          <Phone className="w-5 h-5" />
                          <span>התקשר</span>
                        </a>
                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => {
                            handleDelete(selectedAppointment.id, selectedAppointment.client_name)
                            closeMenu()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span>מחק</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bouton Retour à aujourd'hui */}
        {selectedDate !== getLocalDateString(new Date()) && (
          <div className="flex justify-center pb-4 px-3">
            <Button
              onClick={handleBackToToday}
              className="bg-blue-600 active:bg-blue-700 text-white font-semibold px-6 py-3 flex items-center gap-2 touch-manipulation"
            >
              <Calendar className="w-4 h-4" />
              חזרה להיום
            </Button>
          </div>
        )}

        {/* Bouton flottant pour créer un nouveau RDV - Géant et fixe pour mobile */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 w-20 h-20 bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 z-50 touch-manipulation"
          aria-label="הוסף תור חדש"
          style={{
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Plus className="w-10 h-10" />
        </button>

        {/* Modal pour créer un nouveau RDV */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
              <CardHeader className="flex items-center justify-between border-b border-slate-700">
                <CardTitle className="text-2xl text-white">תור חדש</CardTitle>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSaveAppointment} className="space-y-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-slate-300">תאריך</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>

                  {/* Heure - Deux selects séparés */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">שעה</Label>
                    <div className="flex gap-3">
                      {/* Select pour les heures */}
                      <div className="flex-1">
                        <select
                          id="hour"
                          value={newAppointment.hour}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, hour: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                          required
                        >
                          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
                            const hour = START_HOUR + i
                            return (
                              <option key={hour} value={hour.toString().padStart(2, '0')} className="bg-slate-700">
                                {hour.toString().padStart(2, '0')}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      
                      {/* Séparateur */}
                      <div className="flex items-center text-white text-xl font-bold">
                        :
                      </div>
                      
                      {/* Select pour les minutes */}
                      <div className="flex-1">
                        <select
                          id="minute"
                          value={newAppointment.minute}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, minute: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                          required
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => (
                            <option key={min} value={min.toString().padStart(2, '0')} className="bg-slate-700">
                              {min.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-slate-300">שירות</Label>
                    <select
                      id="service"
                      value={newAppointment.service}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">בחר שירות</option>
                      {SERVICES.map((service) => (
                        <option key={service} value={service} className="bg-slate-700">
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nom du client */}
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-slate-300">שם הלקוח</Label>
                    <Input
                      id="clientName"
                      type="text"
                      value={newAppointment.clientName}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, clientName: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="הזן שם"
                      required
                    />
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone" className="text-slate-300">טלפון</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={newAppointment.clientPhone}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, clientPhone: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="הזן מספר טלפון"
                      required
                    />
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      ביטול
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSaving ? 'שומר...' : 'שמירה'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
