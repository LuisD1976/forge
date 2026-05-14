import React from 'react'
import { motion } from 'framer-motion'
import { Home, BarChart2, Plus, Users, User, Sparkles } from 'lucide-react'
import type { NavTab } from '../types'

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  notificationCount?: number
}

const TABS: { id: NavTab; icon: React.ElementType; label: string }[] = [
  { id: 'home', icon: Home, label: 'Inicio' },
  { id: 'ranks', icon: BarChart2, label: 'Rangos' },
  { id: 'add', icon: Plus, label: '' },
  { id: 'coach', icon: Sparkles, label: 'Coach' },
  { id: 'friends', icon: Users, label: 'Social' },
  { id: 'profile', icon: User, label: 'Perfil' },
]

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, notificationCount = 0 }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div
        className="flex items-center justify-around px-2 h-16 border-t border-forge-border"
        style={{ backgroundColor: 'rgba(24,24,28,0.97)', backdropFilter: 'blur(12px)' }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isAdd = tab.id === 'add'
          const isActive = activeTab === tab.id

          if (isAdd) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center gap-1 -top-3 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg ${isActive ? 'ring-2 ring-white/30' : ''}`}
                  style={{
                    background: 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)',
                    boxShadow: `0 4px 20px rgba(255,107,26,${isActive ? 0.7 : 0.5})`,
                  }}
                >
                  <Plus size={28} />
                </motion.div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? '#FF6B1A' : 'rgba(245,245,240,0.5)' }}
                >
                  Entrenar
                </span>
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-1 min-w-[56px] py-1"
            >
              {/* Active indicator bar at top */}
              <div className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 overflow-hidden">
                <motion.div
                  animate={{ width: isActive ? 28 : 0, opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full bg-forge-orange rounded-full"
                  style={{ width: isActive ? 28 : 0 }}
                />
              </div>

              <motion.div whileTap={{ scale: 0.82 }} className="relative">
                {tab.id === 'coach' && isActive ? (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 0 10px rgba(255,107,26,0.6)' }}
                  >
                    <Sparkles size={15} className="text-white" />
                  </div>
                ) : (
                  <Icon
                    size={22}
                    className="transition-colors duration-200"
                    style={{ color: isActive ? '#FF6B1A' : 'rgba(245,245,240,0.35)' }}
                  />
                )}
                {tab.id !== 'coach' && tab.id === 'friends' && notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </motion.div>

              {tab.label && (
                <span
                  className="text-[10px] font-medium transition-colors duration-200"
                  style={{ color: isActive ? '#FF6B1A' : 'rgba(245,245,240,0.35)' }}
                >
                  {tab.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
