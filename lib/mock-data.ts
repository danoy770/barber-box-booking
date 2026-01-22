// Mock data for the booking system
// This will be replaced with real API calls later

export interface Service {
  id: string
  name: string
  description: string
  duration: string
}

export interface Barber {
  id: string
  name: string
  description: string
}

export const MOCK_SERVICES: Service[] = [
  {
    id: "haircut",
    name: "תספורת גברים",
    description: "תספורת מקצועית עם תדלוק",
    duration: "30 דקות",
  },
  {
    id: "beard",
    name: "תספורת זקן",
    description: "תספורת וטיפול בזקן",
    duration: "20 דקות",
  },
  {
    id: "haircut-beard",
    name: "תספורת + זקן",
    description: "חבילה מלאה - תספורת וזקן",
    duration: "45 דקות",
  },
]

export const MOCK_BARBERS: Barber[] = [
  {
    id: "dan",
    name: "דן",
    description: "מעצב בכיר עם 10 שנות ניסיון",
  },
  {
    id: "yohan",
    name: "יוחנן",
    description: "מומחה בתספורות מודרניות",
  },
]

export const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
]

// WhatsApp API integration helper (to be implemented)
export async function sendWhatsAppConfirmation(
  phone: string,
  bookingDetails: {
    service: string
    barber: string
    date: string
    time: string
    name: string
  }
) {
  // TODO: Implement WhatsApp API integration
  // This is a placeholder for future implementation
  console.log("WhatsApp confirmation would be sent to:", phone, bookingDetails)
  return { success: true }
}
