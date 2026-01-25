"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Trash2, Phone, CalendarDays, Plus, X, User, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Type pour les rendez-vous
type Appointment = {
  id: number
  client_name: string
  client_phone: string
  service_name: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  service_duration?: number // Durée en minutes
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

// Durées par défaut pour chaque service (en minutes)
const SERVICE_DURATIONS: Record<string, number> = {
  "תספורת גבר/ילד": 30,
  "תספורת ילד ללא דירוג (עד גיל 13)": 20,
  "תספורת מדורג מספר חצי ומטה": 30,
  "תספורת גבר + זקן": 45,
  "תספורת אברך": 30,
  "תספורת אברך + זקן": 45,
  "2 תספורות": 60,
  "3 תספורות": 90,
  "תספורת 2 ילדים ללא דירוג": 40,
  "תספורת 3 ילדים ללא דירוג": 60,
  "סידור זקן או פס": 15,
  "הסרת שיער בלייזר מלא": 60,
  "הסרת שיער בלייזר אזור 1": 30,
  "תספורת ראשונה לילד (חלאקה)": 30,
  "תספורת עד הבית": 30,
  "שעווה": 30,
  "תספורת פרימיום": 45,
  "טיפול פנים + תספורת": 60
}

// Fonction pour formater une durée en minutes en texte hébreu lisible
function formatDurationHebrew(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} דקות`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 שעה' : `${hours} שעות`
  }
  
  const hoursText = hours === 1 ? '1 שעה' : `${hours} שעות`
  const minutesText = remainingMinutes === 1 ? 'דקה אחת' : `${remainingMinutes} דקות`
  
  return `${hoursText} ו-${minutesText}`
}

// Générer toutes les durées disponibles de 5 en 5 minutes (de 5 min à 23h55 = 1435 min)
const AVAILABLE_DURATIONS = Array.from({ length: Math.floor(1435 / 5) }, (_, i) => (i + 1) * 5)

// Constantes pour les jours et mois en hébreu
const DAYS_HEBREW = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
const MONTHS_HEBREW = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
]

// Fonction pour formater la date en hébreu
function formatDateHuman(dateStr: string) {
  if (!dateStr) return ""
  try {
    let d: Date
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number)
      d = new Date(year, month - 1, day)
    } else {
      d = new Date(dateStr)
    }
    
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

// Fonction pour obtenir la date locale au format YYYY-MM-DD
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

// Fonction pour générer les 7 prochains jours (à partir d'une date de référence, ou aujourd'hui par défaut)
function getNext7Days(referenceDate?: Date): Array<{ date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }> {
  const days = []
  const baseDate = referenceDate ? new Date(referenceDate) : new Date()
  baseDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayLocalStr = getLocalDateString(today)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() + i)
    const dateStr = getLocalDateString(date)
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

// Fonction pour obtenir la semaine (dimanche à samedi) contenant une date donnée
function getWeekContainingDate(targetDate: Date): Array<{ date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }> {
  const days = []
  const date = new Date(targetDate)
  date.setHours(0, 0, 0, 0)
  
  // Trouver le dimanche de la semaine (jour 0 = dimanche)
  const dayOfWeek = date.getDay()
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - dayOfWeek)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayLocalStr = getLocalDateString(today)
  
  // Générer les 7 jours de la semaine (dimanche à samedi)
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(sunday)
    weekDate.setDate(sunday.getDate() + i)
    const dateStr = getLocalDateString(weekDate)
    const isToday = dateStr === todayLocalStr
    
    days.push({
      date: weekDate,
      dateStr,
      dayName: getDayName(weekDate),
      dayNumber: weekDate.getDate(),
      isToday
    })
  }
  
  return days
}

export default function AdminPage() {
  const getTodayLocal = () => {
    const today = new Date()
    return getLocalDateString(today)
  }
  const todayDate = getTodayLocal()
  
  // Données de test
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, client_name: 'David', client_phone: '050-123-4567', service_name: 'תספורת גבר', date: todayDate, time: '10:00', service_duration: 5 },
    { id: 2, client_name: 'Yossi', client_phone: '050-234-5678', service_name: 'זקן', date: todayDate, time: '10:15', service_duration: 15 },
    { id: 3, client_name: 'Ariel', client_phone: '050-345-6789', service_name: 'תספורת + זקן', date: todayDate, time: '10:30', service_duration: 30 }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(todayDate)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    date: getTodayLocal(),
    hour: '08',
    minute: '00',
    service: '',
    clientName: '',
    clientPhone: '',
    isPause: false,
    duration: 30
  })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [editingDuration, setEditingDuration] = useState<number | null>(null)
  const [isUpdatingDuration, setIsUpdatingDuration] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null)
  const [snappedPosition, setSnappedPosition] = useState<number | null>(null)
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null) // Position Y actuelle du bloc pendant le drag
  const [dragOriginalTop, setDragOriginalTop] = useState<number | null>(null) // Position d'origine pour le fantôme
  const [dragStartY, setDragStartY] = useState<number | null>(null) // Position Y initiale de la souris au début du drag
  const [dragStartTime, setDragStartTime] = useState<string | null>(null) // Heure de début originale du RDV
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')
  const [hasDragged, setHasDragged] = useState(false)
  const [lastSnapTime, setLastSnapTime] = useState<number>(0)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date())

  // Constantes pour l'échelle de la grille
  const HOUR_HEIGHT = 250 // Hauteur fixe par heure en pixels (zoom amélioré pour la lisibilité)
  const START_HOUR = 8 // Heure de début (8:00)
  const END_HOUR = 20 // Heure de fin (20:00)
  const TOTAL_HOURS = END_HOUR - START_HOUR // 12 heures
  const GRID_TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT // Hauteur totale de la grille
  const SNAP_INTERVAL_PX = HOUR_HEIGHT / 12 // ~20.83px pour 5 minutes (250/12)

  // Charger les appointments depuis Supabase
  // TEMPORAIREMENT DÉSACTIVÉ POUR LES DONNÉES DE TEST
  /*
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('id, client_name, client_phone, service_name, date, time, service_duration')
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
  */

  // Synchroniser la date du formulaire avec la date sélectionnée
  useEffect(() => {
    setNewAppointment(prev => ({ ...prev, date: selectedDate, hour: '08', minute: '00', isPause: false, duration: 30 }))
  }, [selectedDate])

  // Mettre à jour l'heure actuelle chaque minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])

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

  // Calculer la hauteur d'un rendez-vous en pixels
  // Hauteur stricte : (duration / 60) * HOUR_HEIGHT — proportionnelle au temps réel
  // Pas de minimum : les courts RDV (ex. 5 min) prennent peu de place, les créneaux vides (gaps) restent visibles
  // Avec HOUR_HEIGHT = 250, 5 min = ~20.83px, 30 min = 125px, 45 min = 187.5px
  const calculateAppointmentHeightPx = (durationMinutes: number = 30): number => {
    return (durationMinutes / 60) * HOUR_HEIGHT
  }

  // Fonction pour normaliser une date au format YYYY-MM-DD
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return ''
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  // Fonction pour détecter une collision totale (même heure de début)
  const detectFullCollision = (
    startTime: string,
    date: string,
    excludeId?: number
  ): Appointment | null => {
    const filteredAppts = appointments.filter(apt => {
      const aptDate = normalizeDate(apt.date)
      const selectedDateNormalized = normalizeDate(date)
      return aptDate === selectedDateNormalized && apt.id !== excludeId
    })
    
    return filteredAppts.find(apt => apt.time === startTime) || null
  }

  // Fonction pour trouver le prochain rendez-vous
  const findNextAppointment = (
    startTime: string,
    date: string,
    excludeId?: number
  ): Appointment | null => {
    const filteredAppts = appointments.filter(apt => {
      const aptDate = normalizeDate(apt.date)
      const selectedDateNormalized = normalizeDate(date)
      return aptDate === selectedDateNormalized && apt.id !== excludeId
    })
    
    const startMinutes = timeToMinutes(startTime)
    
    const nextAppt = filteredAppts
      .filter(apt => {
        const aptStartMinutes = timeToMinutes(apt.time)
        return aptStartMinutes > startMinutes
      })
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))[0]
    
    return nextAppt || null
  }

  // Fonction pour ajuster automatiquement la durée pour éviter l'empiètement
  const adjustDurationForOverlap = (
    startTime: string,
    requestedDuration: number,
    date: string,
    excludeId?: number
  ): { adjustedDuration: number; wasAdjusted: boolean } => {
    const nextAppt = findNextAppointment(startTime, date, excludeId)
    
    if (!nextAppt) {
      return { adjustedDuration: requestedDuration, wasAdjusted: false }
    }
    
    const startMinutes = timeToMinutes(startTime)
    const nextStartMinutes = timeToMinutes(nextAppt.time)
    const availableMinutes = nextStartMinutes - startMinutes
    
    if (availableMinutes >= requestedDuration) {
      return { adjustedDuration: requestedDuration, wasAdjusted: false }
    }
    
    const adjustedMinutes = Math.floor(availableMinutes / 5) * 5
    
    if (adjustedMinutes < 5) {
      return { adjustedDuration: requestedDuration, wasAdjusted: false }
    }
    
    return { adjustedDuration: adjustedMinutes, wasAdjusted: true }
  }

  // Calculer les positions des rendez-vous avec analyse du gap (Smart Gap)
  // Positionnement absolu strict : chaque RDV est positionné selon son heure exacte
  // Top = (minutesDepuis8h / 60) * HOUR_HEIGHT
  // Height = (duree / 60) * HOUR_HEIGHT (hauteur stricte, sans retrait)
  const calculateAppointmentLayout = (appointments: Appointment[]) => {
    const aptsWithPositions = appointments.map(apt => {
      const startMinutes = timeToMinutes(apt.time)
      const durationMinutes = apt.service_duration || 30
      const endMinutes = startMinutes + durationMinutes
      const endTime = calculateEndTime(apt.time, durationMinutes)
      // topPx = (minutesDepuis8h / 60) * HOUR_HEIGHT
      const topPx = timeToPositionPx(apt.time)
      // heightPx = (duree / 60) * HOUR_HEIGHT (hauteur stricte)
      const heightPx = calculateAppointmentHeightPx(durationMinutes)
      
      return {
        ...apt,
        startMinutes,
        endMinutes,
        endTime,
        topPx, // Position absolue basée sur l'heure de début
        heightPx, // Hauteur : (durée_minutes / 60) * HOUR_HEIGHT
        durationMinutes
      }
    })

    aptsWithPositions.sort((a, b) => a.startMinutes - b.startMinutes)
    
    // Calculer le gap avec le rendez-vous suivant pour chaque RDV
    const aptsWithGap = aptsWithPositions.map((apt, index) => {
      const nextApt = aptsWithPositions[index + 1]
      let gap = null
      
      if (nextApt) {
        // Gap = différence entre le début du suivant et la fin de l'actuel
        gap = nextApt.startMinutes - apt.endMinutes
      }
      
      return {
        ...apt,
        gap, // Gap en minutes avec le rendez-vous suivant (null si c'est le dernier)
        nextAppointment: nextApt || null
      }
    })
    
    return aptsWithGap
  }

  // Obtenir la position de la ligne "Maintenant"
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

  // Générer les heures de la journée (8h à 20h)
  const generateTimeSlots = () => {
    const hours = []
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return hours
  }

  // Fonction pour calculer la position snapée
  const snapToInterval = (yPx: number): number => {
    const snapped = Math.round(yPx / SNAP_INTERVAL_PX) * SNAP_INTERVAL_PX
    return Math.max(0, Math.min(snapped, GRID_TOTAL_HEIGHT))
  }

  // Calculer l'heure à partir d'une position Y en pixels
  const positionToTime = (yPx: number): { hour: string; minute: string } => {
    const minutesFromStart = (yPx / HOUR_HEIGHT) * 60
    const totalMinutes = START_HOUR * 60 + minutesFromStart
    const roundedMinutes = Math.round(totalMinutes / 5) * 5
    
    const hours = Math.floor(roundedMinutes / 60)
    const minutes = roundedMinutes % 60
    
    if (hours < START_HOUR || hours > END_HOUR) {
      return { hour: '08', minute: '00' }
    }
    
    return {
      hour: hours.toString().padStart(2, '0'),
      minute: minutes.toString().padStart(2, '0')
    }
  }

  // Gérer le clic sur un bloc de rendez-vous
  const handleAppointmentClick = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation()
    setSelectedAppointment(apt)
    setIsAppointmentModalOpen(true)
  }

  // Gérer le début du drag
  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    setDraggedAppointment(apt)
    setHasDragged(false)
    setSnappedPosition(null)
    setLastSnapTime(0)
    
    // Sauvegarder la position Y initiale de la souris (Delta Y = 0 au début)
    setDragStartY(e.clientY)
    
    // Sauvegarder l'heure de début originale du RDV
    setDragStartTime(apt.time)
    
    // Sauvegarder la position d'origine pour le fantôme
    const appointmentsWithLayout = calculateAppointmentLayout([apt])
    if (appointmentsWithLayout.length > 0) {
      setDragOriginalTop(appointmentsWithLayout[0].topPx)
      // Initialiser dragCurrentY à la position d'origine
      setDragCurrentY(appointmentsWithLayout[0].topPx)
    }
    
    e.dataTransfer.effectAllowed = 'move'
    
    // Créer une image de drag invisible pour permettre le contrôle manuel du positionnement
    const dragImage = document.createElement('div')
    dragImage.style.width = '1px'
    dragImage.style.height = '1px'
    dragImage.style.opacity = '0'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-9999px'
    dragImage.style.left = '-9999px'
    document.body.appendChild(dragImage)
    
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  // Gérer le survol d'une cellule pendant le drag
  // NOUVELLE LOGIQUE : Utilise uniquement le Delta Y (distance parcourue depuis le début du clic)
  const handleDragOver = (e: React.DragEvent, topPx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (!draggedAppointment || dragStartY === null || dragStartTime === null) return
    
    // Calculer le Delta Y (distance parcourue par la souris depuis le début du clic)
    const deltaY = e.clientY - dragStartY
    
    // Constante : hauteur d'un créneau de 5 minutes
    const HEIGHT_OF_5_MIN_SLOT = HOUR_HEIGHT / 12 // ~20.83px avec HOUR_HEIGHT = 250
    
    // Calculer le nombre de 'crans' de 5 minutes parcourus
    const steps = Math.round(deltaY / HEIGHT_OF_5_MIN_SLOT)
    
    // Calculer la nouvelle heure de début en appliquant le décalage au startTime d'origine
    const originalStartMinutes = timeToMinutes(dragStartTime)
    const newStartMinutes = originalStartMinutes + (steps * 5) // Chaque step = 5 minutes
    
    // Vérifier les limites (8h - 20h)
    const clampedStartMinutes = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - (draggedAppointment.service_duration || 30), newStartMinutes))
    
    // Convertir en position Y sur la grille
    const newStartTimeString = `${Math.floor(clampedStartMinutes / 60).toString().padStart(2, '0')}:${(clampedStartMinutes % 60).toString().padStart(2, '0')}`
    const newTopPx = timeToPositionPx(newStartTimeString)
    
    // Mettre à jour immédiatement la position visuelle du bloc
    // Réactivité immédiate : dès que steps change, le top se met à jour
    setDragCurrentY(newTopPx)
    setSnappedPosition(newTopPx)
    
    // Feedback haptique quand on passe à un nouveau cran (tous les ~21px)
    const currentTime = Date.now()
    if (currentTime - lastSnapTime > 50) { // Réduire à 50ms pour plus de réactivité
      setLastSnapTime(currentTime)
      if (navigator.vibrate) {
        navigator.vibrate(5) // Vibration plus courte
      }
    }
    
    setDragOverPosition(newTopPx)
  }

  // Gérer la sortie d'une cellule
  const handleDragLeave = () => {
    setDragOverPosition(null)
  }

  // Gérer le drop d'un rendez-vous
  const handleDrop = async (e: React.DragEvent, topPx: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedAppointment) return
    
    setHasDragged(true)

    const cellElement = e.currentTarget as HTMLElement
    const rect = cellElement.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const absoluteY = topPx + relativeY

    const finalY = snappedPosition !== null ? snappedPosition : snapToInterval(absoluteY)

    const newTime = positionToTime(finalY)
    const newTimeString = `${newTime.hour}:${newTime.minute}`

    // Détecter collision totale
    const collision = detectFullCollision(newTimeString, selectedDate, draggedAppointment.id)
    if (collision) {
      setToastType('error')
      setToastMessage('Créneau occupé')
      setTimeout(() => {
        setToastMessage(null)
      }, 3000)
      setDraggedAppointment(null)
      setDragOverPosition(null)
      setSnappedPosition(null)
      setDragCurrentY(null)
      setDragOriginalTop(null)
      return
    }

    // Ajuster automatiquement la durée si nécessaire
    const currentDuration = draggedAppointment.service_duration || 30
    const { adjustedDuration, wasAdjusted } = adjustDurationForOverlap(
      newTimeString,
      currentDuration,
      selectedDate,
      draggedAppointment.id
    )

    const newTimeMinutes = timeToMinutes(newTimeString)
    const endTimeMinutes = newTimeMinutes + adjustedDuration
    const endHour = Math.floor(endTimeMinutes / 60)
    
    if (endHour > END_HOUR) {
      setToastType('error')
      setToastMessage(`לא ניתן להעביר את התור - הוא יסתיים אחרי ${END_HOUR}:00`)
      setTimeout(() => {
        setToastMessage(null)
      }, 3000)
      setDraggedAppointment(null)
      setDragOverPosition(null)
      setSnappedPosition(null)
      setDragCurrentY(null)
      setDragOriginalTop(null)
      return
    }

    try {
      const updateData: { time: string; service_duration?: number } = { time: newTimeString }
      if (wasAdjusted) {
        updateData.service_duration = adjustedDuration
      }
      
      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', draggedAppointment.id)

      if (error) {
        console.error('Erreur lors du déplacement:', error)
        setToastType('error')
        setToastMessage('אירעה שגיאה בהעברת התור')
        setTimeout(() => {
          setToastMessage(null)
        }, 3000)
      } else {
        const { data: allData, error: loadError } = await supabase
          .from('appointments')
          .select('id, client_name, client_phone, service_name, date, time, service_duration')
          .order('date', { ascending: true })
          .order('time', { ascending: true })

        if (!loadError && allData) {
          setAppointments(allData as Appointment[])
        }

        if (wasAdjusted) {
          setToastType('info')
          setToastMessage('המשך הותאם כדי למנוע חפיפה')
        } else {
          setToastType('success')
          setToastMessage(`התור הועבר ל־${newTimeString}`)
        }
        setTimeout(() => {
          setToastMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Erreur lors du déplacement:', error)
      setToastType('error')
      setToastMessage('אירעה שגיאה בהעברת התור')
      setTimeout(() => {
        setToastMessage(null)
      }, 3000)
    } finally {
      setDraggedAppointment(null)
      setDragOverPosition(null)
      setSnappedPosition(null)
      setDragCurrentY(null)
      setDragOriginalTop(null)
      setDragStartY(null)
      setDragStartTime(null)
    }
  }

  // Gérer la fin du drag
  const handleDragEnd = async (e: React.DragEvent) => {
    // Réinitialiser les états visuels
    const finalSnappedPosition = snappedPosition
    setDragCurrentY(null)
    setDragOriginalTop(null)
    setDragStartY(null)
    setDragStartTime(null)
    
    if (!hasDragged && draggedAppointment && finalSnappedPosition !== null) {
      const finalY = finalSnappedPosition
      const newTime = positionToTime(finalY)
      const newTimeString = `${newTime.hour}:${newTime.minute}`

      const collision = detectFullCollision(newTimeString, selectedDate, draggedAppointment.id)
      if (collision) {
        setToastType('error')
        setToastMessage('Créneau occupé')
        setTimeout(() => {
          setToastMessage(null)
        }, 3000)
        setDraggedAppointment(null)
        setDragOverPosition(null)
        setSnappedPosition(null)
        setDragCurrentY(null)
        setDragOriginalTop(null)
        setDragStartY(null)
        setDragStartTime(null)
        return
      }

      const currentDuration = draggedAppointment.service_duration || 30
      const { adjustedDuration, wasAdjusted } = adjustDurationForOverlap(
        newTimeString,
        currentDuration,
        selectedDate,
        draggedAppointment.id
      )

      const newTimeMinutes = timeToMinutes(newTimeString)
      const endTimeMinutes = newTimeMinutes + adjustedDuration
      const endHour = Math.floor(endTimeMinutes / 60)
      
      if (endHour <= END_HOUR) {
        try {
          const updateData: { time: string; service_duration?: number } = { time: newTimeString }
          if (wasAdjusted) {
            updateData.service_duration = adjustedDuration
          }
          
          const { error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', draggedAppointment.id)

          if (!error) {
            const { data: allData, error: loadError } = await supabase
              .from('appointments')
              .select('id, client_name, client_phone, service_name, date, time, service_duration')
              .order('date', { ascending: true })
              .order('time', { ascending: true })

            if (!loadError && allData) {
              setAppointments(allData as Appointment[])
            }

            if (wasAdjusted) {
              setToastType('info')
              setToastMessage('המשך הותאם כדי למנוע חפיפה')
            } else {
              setToastType('success')
              setToastMessage(`התור הועבר ל־${newTimeString}`)
            }
            setTimeout(() => {
              setToastMessage(null)
            }, 3000)
          }
        } catch (error) {
          console.error('Erreur lors du déplacement:', error)
        }
      }
    }
    
    if (!hasDragged) {
      setDraggedAppointment(null)
      setDragOverPosition(null)
      setSnappedPosition(null)
      setDragCurrentY(null)
      setDragOriginalTop(null)
      setDragStartY(null)
      setDragStartTime(null)
    }
    
    setTimeout(() => {
      setHasDragged(false)
    }, 100)
  }

  // Fermer la modale de rendez-vous
  const closeAppointmentModal = () => {
    setIsAppointmentModalOpen(false)
    setSelectedAppointment(null)
  }

  // Fonction pour convertir un numéro au format international pour WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.startsWith('0')) {
      return `+972${cleaned.substring(1)}`
    }
    
    if (cleaned.startsWith('972')) {
      return `+${cleaned}`
    }
    
    if (cleaned.startsWith('+972')) {
      return cleaned
    }
    
    return `+972${cleaned}`
  }

  // Fonction pour générer le message WhatsApp pré-rempli
  const getWhatsAppMessage = (clientName: string): string => {
    return encodeURIComponent(`שלום ${clientName}, זה ברבר בוקס...`)
  }

  // Fonction de suppression
  const handleDelete = async (id: number, clientName: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את התור של ${clientName}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) {
        alert('אירעה שגיאה במחיקת התור')
        console.error('Erreur Supabase:', error)
      } else {
        setAppointments(prev => prev.filter(appt => appt.id !== id))
        alert('התור נמחק בהצלחה')
        closeAppointmentModal()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('אירעה שגיאה במחיקת התור')
    }
  }

  // Filtrer et trier les rendez-vous par date sélectionnée
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = normalizeDate(apt.date)
    const selectedDateNormalized = normalizeDate(selectedDate)
    return aptDate === selectedDateNormalized
  })
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return a.time.localeCompare(b.time)
  })

  // Fonction pour revenir à aujourd'hui
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

  // Fonction pour compter les RDV par date
  const getAppointmentsCountByDate = (dateStr: string): number => {
    const normalizedDate = normalizeDate(dateStr)
    return appointments.filter(apt => {
      const aptDate = normalizeDate(apt.date)
      return aptDate === normalizedDate
    }).length
  }

  // Fonction pour générer les jours du mois (avec jours précédents/suivants pour compléter la grille)
  const generateMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() // 0 = dimanche, 6 = samedi
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; dateStr: string }> = []
    
    // Jours du mois précédent pour compléter la première semaine
    const prevMonth = new Date(year, month, 0)
    const daysInPrevMonth = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date,
        isCurrentMonth: false,
        dateStr: getLocalDateString(date)
      })
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        isCurrentMonth: true,
        dateStr: getLocalDateString(date)
      })
    }
    
    // Jours du mois suivant pour compléter la dernière semaine (jusqu'à 42 jours au total)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        dateStr: getLocalDateString(date)
      })
    }
    
    return days
  }

  // Navigation mois précédent/suivant
  const handlePreviousMonth = () => {
    setCalendarViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCalendarViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const handleGoToToday = () => {
    const today = new Date()
    setCalendarViewDate(today)
    setSelectedDate(getLocalDateString(today))
  }

  // Ouvrir la modale calendrier et initialiser avec la date sélectionnée
  const handleOpenCalendarModal = () => {
    const selectedDateObj = new Date(selectedDate + 'T00:00:00')
    if (!isNaN(selectedDateObj.getTime())) {
      setCalendarViewDate(selectedDateObj)
    }
    setIsCalendarModalOpen(true)
  }

  // Sélectionner un jour depuis le calendrier
  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDate(dateStr)
    setIsCalendarModalOpen(false)
  }

  // Fonction pour enregistrer un nouveau rendez-vous
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const time = `${newAppointment.hour}:${newAppointment.minute}`
    
    if (newAppointment.isPause) {
      setIsSaving(true)
      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert([{
            client_name: 'Pause',
            client_phone: '',
            service_name: 'Pause',
            date: newAppointment.date,
            time: time,
            stylist: 'Dan Cohen',
            service_duration: newAppointment.duration
          }])
          .select()
          .single()

        if (error) {
          console.error('Erreur lors de l\'enregistrement:', error)
          alert('אירעה שגיאה בשמירת ההפסקה')
        } else {
          const { data: allData, error: loadError } = await supabase
            .from('appointments')
            .select('id, client_name, client_phone, service_name, date, time, service_duration')
            .order('date', { ascending: true })
            .order('time', { ascending: true })

          if (!loadError && allData) {
            setAppointments(allData as Appointment[])
          }

          setNewAppointment({
            date: selectedDate,
            hour: '08',
            minute: '00',
            service: '',
            clientName: '',
            clientPhone: '',
            isPause: false,
            duration: 30
          })
          setIsModalOpen(false)
          alert('ההפסקה נשמרה בהצלחה')
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error)
        alert('אירעה שגיאה בשמירת ההפסקה')
      } finally {
        setIsSaving(false)
      }
      return
    }
    
    if (!time || !newAppointment.service || !newAppointment.clientName || !newAppointment.clientPhone) {
      alert('נא למלא את כל השדות')
      return
    }

    // Détecter collision totale
    const collision = detectFullCollision(time, newAppointment.date)
    if (collision) {
      setToastType('error')
      setToastMessage('Créneau occupé')
      setTimeout(() => {
        setToastMessage(null)
      }, 3000)
      return
    }

    // Ajuster automatiquement la durée si nécessaire
    const { adjustedDuration, wasAdjusted } = adjustDurationForOverlap(
      time,
      newAppointment.duration,
      newAppointment.date
    )

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
          service_duration: adjustedDuration
        }])
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de l\'enregistrement:', error)
        alert('אירעה שגיאה בשמירת התור')
      } else {
        const { data: allData, error: loadError } = await supabase
          .from('appointments')
          .select('id, client_name, client_phone, service_name, date, time, service_duration')
          .order('date', { ascending: true })
          .order('time', { ascending: true })

        if (!loadError && allData) {
          setAppointments(allData as Appointment[])
        }

        setNewAppointment({
          date: selectedDate,
          hour: '08',
          minute: '00',
          service: '',
          clientName: '',
          clientPhone: '',
          isPause: false,
          duration: 30
        })
        setIsModalOpen(false)
        
        if (wasAdjusted) {
          setToastType('info')
          setToastMessage('המשך הותאם כדי למנוע חפיפה')
        } else {
          setToastType('success')
          setToastMessage('התור נשמר בהצלחה')
        }
        setTimeout(() => {
          setToastMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      alert('אירעה שגיאה בשמירת התור')
    } finally {
      setIsSaving(false)
    }
  }

  // Générer les 7 jours à afficher
  // Si la date sélectionnée est dans la plage actuelle (7 prochains jours), on garde cette plage
  // Sinon, on affiche la semaine contenant la date sélectionnée
  const default7Days = getNext7Days()
  const selectedDateObj = new Date(selectedDate + 'T00:00:00')
  const isSelectedDateInRange = default7Days.some(day => day.dateStr === selectedDate)
  
  const next7Days = isSelectedDateInRange 
    ? default7Days 
    : getWeekContainingDate(selectedDateObj)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full overflow-x-hidden relative">
      {/* Toast de notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
          toastType === 'error' 
            ? 'bg-red-600' 
            : toastType === 'info' 
            ? 'bg-blue-600' 
            : 'bg-green-600'
        }`}>
          {toastType === 'error' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : toastType === 'info' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
      <div className="w-full py-2 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between px-3">
          <div>
            <h1 className="text-2xl font-bold text-white">ניהול תורים</h1>
            <p className="text-xs text-slate-400 mt-1">ברבר בוקס</p>
          </div>
        </div>

        {/* Barre de navigation des jours */}
        <Card className="shadow-lg bg-slate-800 border-slate-700 mx-0">
          <CardContent className="py-3 px-2">
            <div className="flex items-center justify-between gap-2" dir="rtl">
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
                      <span className="text-xl font-bold text-white">
                        {day.dayNumber}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="relative">
                <button
                  onClick={handleOpenCalendarModal}
                  className="w-14 h-14 rounded-xl bg-slate-700 border border-slate-600 active:bg-slate-600 flex items-center justify-center transition-colors shadow-sm touch-manipulation hover:bg-slate-600"
                >
                  <CalendarDays className="w-6 h-6 text-slate-300" />
                </button>
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
                        className="absolute left-12 right-0 border-t border-slate-700/30"
                        style={{ top: `${index * HOUR_HEIGHT}px` }}
                      ></div>
                    ))}

                    {/* Lignes pour chaque intervalle de 15 minutes */}
                    {Array.from({ length: TOTAL_HOURS * 4 }, (_, i) => {
                      const quarterHour = i * 15
                      const topPx = (quarterHour / 60) * HOUR_HEIGHT
                      return (
                        <div
                          key={`quarter-${i}`}
                          className="absolute left-12 right-0 border-t border-slate-700/10"
                          style={{ top: `${topPx}px` }}
                        ></div>
                      )
                    })}

                    {/* Colonne des heures à gauche (RTL) */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-slate-700 z-10 bg-slate-800/50">
                      {generateTimeSlots().map((time, index) => (
                        <div
                          key={time}
                          className="absolute left-0 w-full flex items-center justify-start ps-1"
                          style={{ top: `${index * HOUR_HEIGHT}px` }}
                        >
                          <span className="text-[10px] text-slate-400 font-medium">{time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Zone des rendez-vous */}
                    <div 
                      className="ps-12 relative w-full" 
                      style={{ height: `${GRID_TOTAL_HEIGHT}px` }}
                    >
                      {/* Cellules cliquables pour chaque créneau de 5 minutes */}
                      {(() => {
                        const cells = []
                        const slotsPerHour = 12
                        const totalSlots = TOTAL_HOURS * slotsPerHour
                        
                        for (let i = 0; i < totalSlots; i++) {
                          const topPx = (i / slotsPerHour) * HOUR_HEIGHT
                          const heightPx = HOUR_HEIGHT / slotsPerHour
                          const time = positionToTime(topPx)
                          
                          cells.push(
                            <div
                              key={`cell-${i}`}
                              className={`absolute left-12 right-0 cursor-pointer transition-all hover:bg-blue-500/10 active:bg-blue-500/20 border-b border-slate-700/10 touch-manipulation group`}
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                zIndex: 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setNewAppointment(prev => ({
                                  ...prev,
                                  date: selectedDate,
                                  hour: time.hour,
                                  minute: time.minute,
                                  isPause: false,
                                  duration: 30
                                }))
                                setIsModalOpen(true)
                              }}
                              onDragOver={(e) => handleDragOver(e, topPx)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, topPx)}
                            >
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/5 border-l-2 border-blue-500/30 pointer-events-none"></div>
                            </div>
                          )
                        }
                        return cells
                      })()}

                      {/* Ligne "Maintenant" */}
                      {getCurrentTimePositionPx() !== null && (
                        <div
                          className="absolute left-12 right-0 border-t-2 border-white z-20 flex items-center gap-2"
                          style={{ top: `${getCurrentTimePositionPx()}px` }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="w-3 h-3 rounded-full bg-white ms-2"></div>
                          <span className="text-[10px] text-white font-medium bg-slate-800 px-2 py-1 rounded">
                            עכשיו {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      {/* Fantôme à la position d'origine pendant le drag */}
                      {draggedAppointment && dragOriginalTop !== null && (
                        <div
                          className="absolute left-12 right-0 opacity-30 pointer-events-none z-20 flex items-center rounded-lg overflow-hidden"
                          style={{
                            top: `${dragOriginalTop}px`,
                            height: `${calculateAppointmentHeightPx(draggedAppointment.service_duration || 30)}px`,
                            position: 'absolute',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderLeft: '4px solid #94a3b8',
                            padding: '4px',
                            backgroundColor: 'rgba(148, 163, 184, 0.2)'
                          }}
                          dir="rtl"
                        >
                          <div className="flex flex-col justify-center gap-0.5 w-full text-right overflow-hidden h-full">
                            <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                              <Clock className="w-3 h-3 flex-shrink-0 text-gray-500" />
                              <span className="font-bold text-xs text-gray-500 truncate min-w-0">
                                {draggedAppointment.time}
                              </span>
                            </div>
                            {draggedAppointment.client_name && draggedAppointment.client_name !== 'Pause' && (
                              <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                                <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="font-semibold text-xs text-gray-500 truncate min-w-0">
                                  {draggedAppointment.client_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Blocs de rendez-vous */}
                      {(() => {
                        const appointmentsWithLayout = calculateAppointmentLayout(sortedAppointments)
                        
                        return appointmentsWithLayout.map((apt, index) => {
                          const isPause = apt.service_name === 'Pause' || apt.client_name === 'Pause'
                          const isDragging = draggedAppointment?.id === apt.id
                          
                          return (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, apt)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                if (!hasDragged) {
                                  handleAppointmentClick(e, apt)
                                }
                              }}
                              className={`absolute left-12 right-0 active:opacity-80 cursor-move touch-manipulation ${
                                isPause 
                                  ? 'bg-amber-100 text-amber-900' 
                                  : 'bg-sky-50 active:bg-sky-100 text-gray-900'
                              } ${
                                isDragging 
                                  ? 'opacity-90 shadow-lg' 
                                  : ''
                              }`}
                              style={{
                                // Calculs mathématiques purs : top = (minutesDepuis8h / 60) * HOUR_HEIGHT
                                top: isDragging && dragCurrentY !== null ? `${dragCurrentY}px` : `${apt.topPx}px`,
                                // VERROUILLAGE GÉOMÉTRIQUE ABSOLU : Force brute
                                // height strict : (duration / 60) * HOUR_HEIGHT
                                height: `${apt.heightPx}px`,
                                // max-height : Empêche toute expansion
                                maxHeight: `${apt.heightPx}px`,
                                // min-height : Écrase toute valeur par défaut de Tailwind/Flex
                                minHeight: '0px',
                                // Positionnement absolu
                                position: 'absolute',
                                // CRUCIAL : box-sizing: border-box - les bordures sont incluses dans la hauteur
                                boxSizing: 'border-box',
                                // CRUCIAL : overflow: hidden - Tout ce qui dépasse doit être coupé net
                                overflow: 'hidden',
                                // Z-index par défaut : 10 (40 seulement pendant le drag)
                                zIndex: isDragging ? 40 : 10,
                                // Aucune margin - les blocs doivent se toucher mathématiquement
                                margin: 0,
                                // Séparation visuelle : border-bottom uniquement (couleur du fond #0f172a)
                                borderBottom: '1px solid #0f172a',
                                borderTop: 'none',
                                borderRight: 'none',
                                // Bordure gauche colorée pour identifier le type (Pause ou RDV)
                                borderLeft: isPause ? '4px solid #f59e0b' : '4px solid #0ea5e9',
                                // Padding vertical à 0, horizontal normal
                                padding: '0px 8px',
                                // Display flex row pour layout horizontal & compact
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                // line-height à 1 (leading-none)
                                lineHeight: '1',
                                // Verrouillage horizontal pendant le drag
                                left: isDragging ? '0' : undefined,
                                right: isDragging ? '48px' : undefined,
                                transform: isDragging ? 'translateX(0)' : undefined,
                                // Pas de transition : snap immédiat
                                transition: undefined
                              }}
                              dir="rtl"
                            >
                              {/* Contenu en ligne horizontale & compact */}
                              <div 
                                className="flex flex-row items-center gap-2 w-full text-right overflow-hidden h-full"
                                style={{
                                  // line-height à 1 pour tout le contenu
                                  lineHeight: '1',
                                  // white-space: nowrap pour une seule ligne
                                  whiteSpace: 'nowrap',
                                  // overflow: hidden pour couper net
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Heure */}
                                <div className="flex items-center gap-1 flex-shrink-0" style={{ whiteSpace: 'nowrap', lineHeight: '1' }}>
                                  <Clock className={`w-3 h-3 flex-shrink-0 ${isPause ? 'text-amber-700' : 'text-gray-700'}`} />
                                  <span 
                                    className={`font-bold text-xs ${isPause ? 'text-amber-900' : 'text-gray-900'}`}
                                    style={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      lineHeight: '1'
                                    }}
                                  >
                                    {apt.time} - {apt.endTime}
                                  </span>
                                </div>
                                {/* Nom du client ou Pause */}
                                {!isPause && (
                                  <div 
                                    className="flex items-center gap-1 flex-shrink-0"
                                    style={{ whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 auto', lineHeight: '1' }}
                                  >
                                    <User className="w-3 h-3 text-gray-700 flex-shrink-0" />
                                    <span 
                                      className="font-semibold text-xs text-gray-900"
                                      style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        lineHeight: '1'
                                      }}
                                    >
                                      {apt.client_name}
                                    </span>
                                  </div>
                                )}
                                {isPause && (
                                  <div className="flex items-center flex-shrink-0" style={{ whiteSpace: 'nowrap', lineHeight: '1' }}>
                                    <span className="font-bold text-xs text-amber-900">
                                      הפסקה
                                    </span>
                                  </div>
                                )}
                                {/* Service */}
                                {!isPause && (
                                  <div 
                                    className="text-xs text-gray-700 flex-shrink-0"
                                    style={{
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '30%',
                                      lineHeight: '1'
                                    }}
                                  >
                                    {apt.service_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      })()}

                      {/* Message si aucun rendez-vous */}
                      {sortedAppointments.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <p className="text-slate-400 text-lg">אין תורים ליום זה</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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

        {/* Bouton flottant pour créer un nouveau RDV */}
        <button
          onClick={() => {
            setNewAppointment({
              date: selectedDate,
              hour: '08',
              minute: '00',
              service: '',
              clientName: '',
              clientPhone: '',
              isPause: false,
              duration: 30
            })
            setIsModalOpen(true)
          }}
          className="fixed bottom-6 right-6 w-20 h-20 bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 z-50 touch-manipulation"
          aria-label="הוסף תור חדש"
          style={{
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Plus className="w-10 h-10" />
        </button>

        {/* Modal pour afficher les détails d'un rendez-vous */}
        {isAppointmentModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl" onClick={closeAppointmentModal}>
            <Card 
              className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-white mb-1">
                    {selectedAppointment.client_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-lg font-semibold">
                      {selectedAppointment.time} - {calculateEndTime(selectedAppointment.time, selectedAppointment.service_duration || 30)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeAppointmentModal}
                  className="text-slate-400 hover:text-white transition-colors ms-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-300">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">שירות</p>
                      <p className="text-base font-medium text-white">{selectedAppointment.service_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">תאריך</p>
                      <p className="text-base font-medium text-white">{formatDateHuman(selectedAppointment.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-400">טלפון</p>
                      <p className="text-base font-medium text-white">{selectedAppointment.client_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-400 mb-2">משך זמן</p>
                      {editingDuration === null ? (
                        <div className="flex items-center gap-3">
                          <p className="text-base font-medium text-white">
                            {formatDurationHebrew(selectedAppointment.service_duration || 30)}
                          </p>
                          <button
                            onClick={() => setEditingDuration(selectedAppointment.service_duration || 30)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            ערוך
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingDuration}
                            onChange={(e) => setEditingDuration(parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            dir="rtl"
                            disabled={isUpdatingDuration}
                          >
                            {AVAILABLE_DURATIONS.map((duration) => (
                              <option key={duration} value={duration} className="bg-slate-700">
                                {formatDurationHebrew(duration)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={async () => {
                              if (!selectedAppointment) return
                              setIsUpdatingDuration(true)
                              try {
                                const { adjustedDuration, wasAdjusted } = adjustDurationForOverlap(
                                  selectedAppointment.time,
                                  editingDuration!,
                                  selectedAppointment.date,
                                  selectedAppointment.id
                                )

                                const { error } = await supabase
                                  .from('appointments')
                                  .update({ service_duration: adjustedDuration })
                                  .eq('id', selectedAppointment.id)

                                if (error) {
                                  console.error('Erreur lors de la mise à jour:', error)
                                  setToastType('error')
                                  setToastMessage('אירעה שגיאה בעדכון המשך')
                                  setTimeout(() => {
                                    setToastMessage(null)
                                  }, 3000)
                                } else {
                                  const { data: allData, error: loadError } = await supabase
                                    .from('appointments')
                                    .select('id, client_name, client_phone, service_name, date, time, service_duration')
                                    .order('date', { ascending: true })
                                    .order('time', { ascending: true })

                                  if (!loadError && allData) {
                                    setAppointments(allData as Appointment[])
                                    const updated = allData.find(a => a.id === selectedAppointment.id)
                                    if (updated) {
                                      setSelectedAppointment(updated as Appointment)
                                    }
                                  }
                                  setEditingDuration(null)
                                  
                                  if (wasAdjusted) {
                                    setToastType('info')
                                    setToastMessage('המשך הותאם כדי למנוע חפיפה')
                                  } else {
                                    setToastType('success')
                                    setToastMessage('המשך עודכן בהצלחה')
                                  }
                                  setTimeout(() => {
                                    setToastMessage(null)
                                  }, 3000)
                                }
                              } catch (error) {
                                console.error('Erreur lors de la mise à jour:', error)
                                setToastType('error')
                                setToastMessage('אירעה שגיאה בעדכון המשך')
                                setTimeout(() => {
                                  setToastMessage(null)
                                }, 3000)
                              } finally {
                                setIsUpdatingDuration(false)
                              }
                            }}
                            disabled={isUpdatingDuration}
                            className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isUpdatingDuration ? 'שומר...' : 'שמור'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingDuration(null)
                            }}
                            disabled={isUpdatingDuration}
                            className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            ביטול
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <Label className="text-slate-300 mb-2 block">סטטוס תשלום</Label>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors"
                      disabled
                    >
                      שולם
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors"
                      disabled
                    >
                      לא שולם
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">פונקציונליות תשלום - בקרוב</p>
                </div>

                <div className="space-y-3 pt-4">
                  <a
                    href={`https://wa.me/${formatPhoneForWhatsApp(selectedAppointment.client_phone)}?text=${getWhatsAppMessage(selectedAppointment.client_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeAppointmentModal}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white transition-colors font-semibold touch-manipulation"
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

                  <a
                    href={`tel:${selectedAppointment.client_phone.replace(/\D/g, '')}`}
                    onClick={closeAppointmentModal}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors font-semibold touch-manipulation"
                  >
                    <Phone className="w-5 h-5" />
                    <span>התקשר</span>
                  </a>

                  <button
                    onClick={() => {
                      handleDelete(selectedAppointment.id, selectedAppointment.client_name)
                    }}
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors font-semibold touch-manipulation"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>מחק</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal pour créer un nouveau RDV */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
            <Card className="w-full max-w-md max-h-[90vh] bg-slate-800 border-slate-700 shadow-2xl flex flex-col">
              <CardHeader className="flex items-center justify-between border-b border-slate-700 flex-shrink-0">
                <CardTitle className="text-2xl text-white">תור חדש</CardTitle>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </CardHeader>
              <CardContent className="pt-6 overflow-y-auto flex-1 min-h-0">
                <form onSubmit={handleSaveAppointment} className="space-y-4" id="appointment-form">
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

                  <div className="space-y-2">
                    <Label className="text-slate-300">שעה</Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <select
                          id="hour"
                          value={newAppointment.hour}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, hour: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white text-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                          dir="rtl"
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
                      
                      <div className="flex items-center text-white text-xl font-bold">
                        :
                      </div>
                      
                      <div className="flex-1">
                        <select
                          id="minute"
                          value={newAppointment.minute}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, minute: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white text-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                          dir="rtl"
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

                  <div className="space-y-2 pt-2 pb-2 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPause"
                        checked={newAppointment.isPause}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, isPause: e.target.checked }))}
                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                      <Label htmlFor="isPause" className="text-slate-300 cursor-pointer text-lg font-medium">
                        הפסקה (חסום את הזמן הזה)
                      </Label>
                    </div>
                  </div>

                  {!newAppointment.isPause && (
                    <div className="space-y-2">
                      <Label htmlFor="service" className="text-slate-300">שירות</Label>
                      <select
                        id="service"
                        value={newAppointment.service}
                        onChange={(e) => {
                          const selectedService = e.target.value
                          const defaultDuration = SERVICE_DURATIONS[selectedService] || 30
                          setNewAppointment(prev => ({ 
                            ...prev, 
                            service: selectedService,
                            duration: defaultDuration
                          }))
                        }}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="rtl"
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
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-slate-300">משך זמן (דקות)</Label>
                    <select
                      id="duration"
                      value={newAppointment.duration}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="rtl"
                      required
                    >
                      {AVAILABLE_DURATIONS.map((duration) => (
                        <option key={duration} value={duration} className="bg-slate-700">
                          {formatDurationHebrew(duration)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!newAppointment.isPause && (
                    <>
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
                    </>
                  )}

                </form>
              </CardContent>
              <div className="border-t border-slate-700 p-4 flex gap-3 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  ביטול
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    const form = document.getElementById('appointment-form') as HTMLFormElement
                    if (form) {
                      form.requestSubmit()
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? 'שומר...' : 'שמירה'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Calendrier Mensuel */}
        {isCalendarModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" dir="rtl" onClick={() => setIsCalendarModalOpen(false)}>
            <Card 
              className="w-full max-w-2xl max-h-[90vh] bg-slate-800 border-slate-700 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex items-center justify-between border-b border-slate-700 pb-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>
                  <div className="text-center">
                    <CardTitle className="text-xl text-white">
                      {MONTHS_HEBREW[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                    </CardTitle>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGoToToday}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    היום
                  </button>
                  <button
                    onClick={() => setIsCalendarModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1 min-h-0">
                {/* En-têtes des jours de la semaine */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS_HEBREW.map((dayName: string, index: number) => (
                    <div key={index} className="text-center text-sm font-semibold text-slate-400 py-2">
                      {dayName}
                    </div>
                  ))}
                </div>
                
                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-2">
                  {generateMonthDays(calendarViewDate.getFullYear(), calendarViewDate.getMonth()).map((day, index) => {
                    const appointmentsCount = getAppointmentsCountByDate(day.dateStr)
                    const isSelected = day.dateStr === selectedDate
                    const isToday = day.dateStr === getLocalDateString(new Date())
                    const isCurrentMonth = day.isCurrentMonth
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (isCurrentMonth) {
                            handleSelectDateFromCalendar(day.dateStr)
                          }
                        }}
                        className={`
                          relative aspect-square p-2 rounded-lg transition-all touch-manipulation
                          ${!isCurrentMonth ? 'text-slate-600' : ''}
                          ${isSelected && isCurrentMonth 
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                            : isCurrentMonth
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            : 'bg-slate-800 text-slate-600'
                          }
                          ${isToday && isCurrentMonth && !isSelected ? 'ring-2 ring-blue-500' : ''}
                        `}
                        disabled={!isCurrentMonth}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>
                            {day.date.getDate()}
                          </span>
                          {appointmentsCount > 0 && (
                            <span className={`
                              text-xs font-bold mt-1 px-1.5 py-0.5 rounded-full
                              ${isSelected 
                                ? 'bg-white text-blue-600' 
                                : 'bg-blue-600 text-white'
                              }
                            `}>
                              {appointmentsCount}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
              <div className="border-t border-slate-700 p-4 flex justify-center flex-shrink-0">
                <button
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                >
                  סגור
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
