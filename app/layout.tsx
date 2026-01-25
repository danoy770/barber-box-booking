import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Barber Box - הזמנת תורים",
  description: "מערכת הזמנת תורים לסלון הברבר שלך",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
