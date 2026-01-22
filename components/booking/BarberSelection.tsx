"use client"

import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_BARBERS } from "@/lib/mock-data"

const BARBERS = MOCK_BARBERS

interface BarberSelectionProps {
  selectedBarber: string | null
  onSelect: (barberId: string) => void
}

export default function BarberSelection({
  selectedBarber,
  onSelect,
}: BarberSelectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        בחר את המעצב שלך
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BARBERS.map((barber) => {
          const isSelected = selectedBarber === barber.id
          return (
            <Card
              key={barber.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(barber.id)}
            >
              <CardContent className="p-6 text-center">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <User className="w-10 h-10" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{barber.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {barber.description}
                </p>
                {isSelected && (
                  <div className="mt-4 text-primary font-semibold text-sm">
                    נבחר
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
