import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Barber Box - הזמנת תורים",
  description: "מערכת הזמנת תורים לסלון הברבר שלך",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
