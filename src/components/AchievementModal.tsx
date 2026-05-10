import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, X } from 'lucide-react'
import { useAchievementsStore } from '../store/achievementsStore'
import { getRarityColor, getRarityLabel } from '../data/achievements'

export const AchievementModal: React.FC = () => {
  const { queue, dismissFirst } = useAchievementsStore()
  const achievement = queue[0] ?? null

  useEffect(() => {
    if (!achievement) return
    const t = setTimeout(dismissFirst, 8000)
    return () => clearTimeout(t)
  }, [achievement?.id])

  return (
    <AnimatePresence>
      {achievement && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={dismissFirst}
          />

          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed inset-0 z-[91] flex items-center justify-center px-6 pointer-events-none"
          >
            <div
              className="w-full max-w-sm rounded-3xl p-6 text-center pointer-events-auto relative overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #13131A 0%, #0E0E14 100%)',
                border: `1px solid ${getRarityColor(achievement.rarity)}40`,
                boxShadow: `0 0 60px ${getRarityColor(achievement.rarity)}30, 0 24px 60px rgba(0,0,0,0.8)`,
              }}
            >
              {/* Glow bg */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 30%, ${getRarityColor(achievement.rarity)}, transparent 70%)` }}
              />

              {/* Close */}
              <button
                onClick={dismissFirst}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-forge-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <X size={14} />
              </button>

              {/* Badge unlocked label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: getRarityColor(achievement.rarity) }}
              >
                ¡Logro desbloqueado!
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.15, duration: 0.5, times: [0, 0.6, 1] }}
                className="text-7xl mb-4 leading-none"
                style={{ filter: `drop-shadow(0 0 20px ${getRarityColor(achievement.rarity)}80)` }}
              >
                {achievement.icon}
              </motion.div>

              {/* Rarity pill */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{
                  backgroundColor: `${getRarityColor(achievement.rarity)}15`,
                  color: getRarityColor(achievement.rarity),
                  border: `1px solid ${getRarityColor(achievement.rarity)}30`,
                }}
              >
                {getRarityLabel(achievement.rarity)}
              </motion.div>

              {/* Name & description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-bold text-forge-white mb-1">{achievement.name}</h2>
                <p className="text-sm text-forge-white/50 mb-4">{achievement.description}</p>
              </motion.div>

              {/* XP reward */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl mb-5 font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.2), rgba(255,160,82,0.1))', color: '#FFA052', border: '1px solid rgba(255,107,26,0.25)' }}
              >
                +{achievement.xpReward} XP
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-2"
              >
                <button
                  onClick={dismissFirst}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-forge-white/60 transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  Continuar
                </button>
                <button
                  onClick={dismissFirst}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.4)' }}
                >
                  <Share2 size={14} />
                  Compartir
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
