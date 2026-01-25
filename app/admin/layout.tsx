"use client"

import Sidebar from "@/components/Sidebar"
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full overflow-x-hidden relative">
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      <div className="lg:me-64">
        {children}
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  )
}
