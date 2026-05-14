import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Dumbbell, Trophy, Users, User, Crown, Zap, Sparkles } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useRanksStore } from '../store/ranksStore'
import { RANK_DATA } from '../data/ranks'
import type { NavTab } from '../types'

interface SidebarProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

const NAV_ITEMS = [
  { id: 'home' as NavTab, icon: Dumbbell, label: 'Entrenar' },
  { id: 'ranks' as NavTab, icon: Trophy, label: 'Rangos' },
  { id: 'coach' as NavTab, icon: Sparkles, label: 'Coach IA' },
  { id: 'friends' as NavTab, icon: Users, label: 'Amigos' },
  { id: 'profile' as NavTab, icon: User, label: 'Perfil' },
]

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useUserStore()
  const { getOverallTier, totalXP } = useRanksStore()
  const overallTier = getOverallTier()
  const rankData = RANK_DATA[overallTier]

  return (
    <aside className="w-60 bg-forge-iron border-r border-forge-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-forge-border">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)' }}
          >
            <Flame size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-forge-orange tracking-wider">FORGE</h1>
            <p className="text-forge-white/30 text-xs leading-none">Forja tus rangos</p>
          </div>
        </div>
      </div>

      {/* User mini-profile */}
      {user && (
        <div className="px-4 py-4 border-b border-forge-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 flex-shrink-0"
              style={{ backgroundColor: rankData.bgColor, borderColor: rankData.color, color: rankData.color }}
            >
              {user.displayName?.[0]?.toUpperCase() ?? 'F'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-forge-white text-sm truncate">{user.displayName}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: rankData.color }}>
                  {rankData.icon} {rankData.label}
                </span>
                {user.isPro && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 px-1">
            <Flame size={12} className="text-forge-orange" />
            <span className="text-xs text-forge-white/50">{user.streak} días de racha</span>
            <span className="text-xs text-forge-white/30 ml-auto">{totalXP.toLocaleString()} XP</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                isActive
                  ? 'bg-forge-orange/15 text-forge-orange'
                  : 'text-forge-white/60 hover:text-forge-white hover:bg-forge-border/50'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-forge-orange' : ''} />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-forge-orange"
                />
              )}
            </motion.button>
          )
        })}

        {/* Start Workout CTA */}
        <div className="mt-4 pt-4 border-t border-forge-border">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange('add')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full ${
              activeTab === 'add'
                ? 'bg-forge-orange text-white'
                : 'bg-forge-orange/10 text-forge-orange hover:bg-forge-orange/20'
            }`}
          >
            <Zap size={18} />
            Iniciar Entreno
          </motion.button>
        </div>
      </nav>

      {/* PRO banner at bottom */}
      {user && !user.isPro && (
        <div className="px-3 pb-4">
          <button
            onClick={() => onTabChange('profile')}
            className="w-full rounded-xl p-3 text-left"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.15), rgba(255,160,82,0.1))' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown size={14} className="text-forge-orange" />
              <span className="text-xs font-bold text-forge-orange">FORGE PRO</span>
            </div>
            <p className="text-xs text-forge-white/50 leading-tight">IA, análisis avanzado y rangos completos</p>
          </button>
        </div>
      )}

      <div className="px-4 pb-4 text-center">
        <p className="text-forge-white/15 text-xs">FORGE v1.0</p>
      </div>
    </aside>
  )
}
