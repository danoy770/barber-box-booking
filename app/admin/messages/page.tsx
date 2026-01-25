"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
  return (
    <div className="w-full p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-2xl">
              <MessageSquare className="w-6 h-6" />
              הודעות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">דף זה יוצג בקרוב...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
