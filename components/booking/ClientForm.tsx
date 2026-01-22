"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { User, Phone } from "lucide-react"

interface ClientFormProps {
  name: string
  phone: string
  onChange: (name: string, phone: string) => void
}

export default function ClientForm({
  name,
  phone,
  onChange,
}: ClientFormProps) {
  return (
    <div className="space-y-6">
      <p className="text-center text-muted-foreground mb-6">
        הזן את הפרטים שלך להשלמת ההזמנה
      </p>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              שם מלא
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="הזן את שמך המלא"
              value={name}
              onChange={(e) => onChange(e.target.value, phone)}
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              מספר טלפון (לשימוש ב-WhatsApp)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => onChange(name, e.target.value)}
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">
              נשלח אליך הודעת אישור דרך WhatsApp
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
