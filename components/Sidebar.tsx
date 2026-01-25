"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Calendar, 
  PieChart, 
  Users, 
  Clock, 
  UserCheck,
  MessageSquare,
  Settings, 
  Menu, 
  X,
  Moon,
  Sun
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const menuItems = [
  {
    label: "יומן",
    icon: Calendar,
    href: "/admin",
    active: true
  },
  {
    label: "סטטיסטיקות",
    icon: PieChart,
    href: "/admin/stats",
    active: false
  },
  {
    label: "לקוחות",
    icon: Users,
    href: "/admin/clients",
    active: false
  },
  {
    label: "שירותים",
    icon: Clock,
    href: "/admin/services",
    active: false
  },
  {
    label: "צוות",
    icon: UserCheck,
    href: "/admin/team",
    active: false,
    hidden: true // Masqué pour l'instant
  },
  {
    label: "שעות פעילות",
    icon: Clock,
    href: "/admin/hours",
    active: false
  },
  {
    label: "הודעות",
    icon: MessageSquare,
    href: "/admin/messages",
    active: false
  },
  {
    label: "הגדרות",
    icon: Settings,
    href: "/admin/settings",
    active: false
  }
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // TODO: Implémenter le changement de thème global
  }

  // Filtrer les éléments masqués
  const visibleMenuItems = menuItems.filter(item => !item.hidden)

  return (
    <>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed right-0 top-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        dir="rtl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">ברבר בוקס</h2>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="סגור תפריט"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onToggle}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer avec Toggle Mode Sombre */}
          <div className="border-t border-slate-800 p-4">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span className="font-medium">מצב כהה</span>
              {isDarkMode ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
