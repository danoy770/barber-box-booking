"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { TIME_SLOTS } from "@/lib/mock-data"

// Generate next 14 days
const generateDates = () => {
  const dates = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }
  return dates
}

interface DateTimeSelectionProps {
  selectedDate: string | null
  selectedTime: string | null
  onSelect: (date: string, time: string) => void
}

export default function DateTimeSelection({
  selectedDate,
  selectedTime,
  onSelect,
}: DateTimeSelectionProps) {
  const [tempDate, setTempDate] = useState<string | null>(selectedDate)
  const dates = generateDates()

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const formatDateDisplay = (date: Date) => {
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
  }

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDate(date)
    setTempDate(dateStr)
    if (selectedTime) {
      onSelect(dateStr, selectedTime)
    }
  }

  const handleTimeSelect = (time: string) => {
    if (tempDate) {
      onSelect(tempDate, time)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          בחר תאריך
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {dates.map((date) => {
            const dateStr = formatDate(date)
            const isSelected = tempDate === dateStr
            const isToday = dateStr === formatDate(new Date())
            return (
              <Card
                key={dateStr}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary"
                )}
                onClick={() => handleDateSelect(date)}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={cn(
                      "font-semibold",
                      isToday && "text-primary"
                    )}
                  >
                    {formatDateDisplay(date)}
                  </div>
                  {isToday && (
                    <div className="text-xs text-primary mt-1">היום</div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Time Selection */}
      {tempDate && (
        <div>
          <h3 className="font-semibold mb-4">בחר שעה</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {TIME_SLOTS.map((time) => {
              const isSelected = selectedTime === time && tempDate === selectedDate
              return (
                <Card
                  key={time}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleTimeSelect(time)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="font-semibold">{time}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
