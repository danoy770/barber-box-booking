"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Scissors, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_SERVICES } from "@/lib/mock-data"

const SERVICE_ICONS: { [key: string]: typeof Scissors } = {
  haircut: Scissors,
  beard: Sparkles,
  "haircut-beard": Scissors,
}

const SERVICES = MOCK_SERVICES.map((service) => ({
  ...service,
  icon: SERVICE_ICONS[service.id] || Scissors,
}))

interface ServiceSelectionProps {
  selectedService: string | null
  onSelect: (serviceId: string) => void
}

export default function ServiceSelection({
  selectedService,
  onSelect,
}: ServiceSelectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground mb-6">
        בחר את השירות הרצוי
      </p>
      <div className="grid grid-cols-1 gap-4">
        {SERVICES.map((service) => {
          const Icon = service.icon
          const isSelected = selectedService === service.id
          return (
            <Card
              key={service.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => onSelect(service.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {service.description}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {service.duration}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
