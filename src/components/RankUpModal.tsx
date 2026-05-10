import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RankTier, MuscleGroup } from '../types'
import { RANK_DATA } from '../data/ranks'

interface RankUpModalProps {
  muscle: MuscleGroup
  fromTier: RankTier
  toTier: RankTier
  xpGained: number
  onClose: () => void
}

function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: '50%',
            y: '50%',
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: `${30 + Math.random() * 40}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
            scale: Math.random() * 2 + 0.5,
          }}
          transition={{
            duration: 1.2 + Math.random() * 0.8,
            delay: Math.random() * 0.4,
            ease: 'easeOut',
          }}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: [color, '#FFA052', '#FFD700'][i % 3] }}
        />
      ))}
    </div>
  )
}

export const RankUpModal: React.FC<RankUpModalProps> = ({
  muscle,
  fromTier,
  toTier,
  xpGained,
  onClose,
}) => {
  const newRank = RANK_DATA[toTier]
  const oldRank = RANK_DATA[fromTier]

  useEffect(() => {
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${newRank.bgColor}, #18181C)`,
            border: `2px solid ${newRank.color}60`,
            boxShadow: `0 0 60px ${newRank.color}40`,
          }}
          onClick={onClose}
        >
          <Particles color={newRank.color} />

          <div className="relative p-8 text-center">
            {/* Rank up label */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-bold tracking-widest uppercase mb-4"
              style={{ color: newRank.color }}
            >
              ¡ SUBIDA DE RANGO !
            </motion.div>

            {/* Muscle name */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-forge-white/60 text-sm capitalize mb-6"
            >
              {muscle}
            </motion.div>

            {/* Rank transition */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Old rank */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.5, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 opacity-50"
                  style={{ backgroundColor: oldRank.bgColor, borderColor: oldRank.color, color: oldRank.color }}
                >
                  {oldRank.icon}
                </div>
                <span className="text-xs text-forge-white/40">{oldRank.label}</span>
              </motion.div>

              {/* Arrow */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.5 }}
                className="text-2xl"
                style={{ color: newRank.color }}
              >
                →
              </motion.div>

              {/* New rank - BIG */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 400, damping: 15 }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border-2"
                  style={{
                    backgroundColor: newRank.bgColor,
                    borderColor: newRank.color,
                    color: newRank.color,
                    boxShadow: `0 0 30px ${newRank.color}60`,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1], filter: [`drop-shadow(0 0 0px ${newRank.color})`, `drop-shadow(0 0 12px ${newRank.color})`, `drop-shadow(0 0 4px ${newRank.color})`] }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    {newRank.icon}
                  </motion.span>
                </div>
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="font-display text-lg"
                  style={{ color: newRank.color }}
                >
                  {newRank.label.toUpperCase()}
                </motion.span>
              </motion.div>
            </div>

            {/* XP gained */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
              style={{ backgroundColor: `${newRank.color}20`, color: newRank.color }}
            >
              +{xpGained} XP
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-xs text-forge-white/30 mt-4"
            >
              Toca para continuar
            </motion.p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
