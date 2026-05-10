import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ChevronRight, X } from 'lucide-react'
import { useRanksStore } from '../store/ranksStore'
import { RANK_DATA, RANK_ORDER } from '../data/ranks'
import { getRankProgress } from '../utils/rankCalculator'
import { ProgressBar } from '../components/ProgressBar'
import { BodySVG } from '../components/BodySVG'
import type { MuscleGroup } from '../types'

export const RanksPage: React.FC = () => {
  const { muscleRanks, totalXP, getOverallTier, getClassifiedCount } = useRanksStore()
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [view, setView] = useState<'body' | 'list'>('body')

  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const classifiedCount = getClassifiedCount()

  const selectedRank = selectedMuscle
    ? muscleRanks.find((r) => r.muscle === selectedMuscle) ?? null
    : null

  const handleMuscleClick = (muscle: MuscleGroup) => {
    setSelectedMuscle((prev) => (prev === muscle ? null : muscle))
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <h1 className="font-display text-3xl text-gradient-forge">MIS RANGOS</h1>
        <p className="text-forge-white/50 text-sm">Tu evolución muscular</p>
      </div>

      {/* Overall rank card */}
      <div className="mx-4 mb-4">
        <div
          className="card-metal p-5 flex items-center gap-4"
          style={{ borderColor: `${overallRank.color}40` }}
        >
          <div
            className="absolute inset-0 opacity-5 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(circle at top right, ${overallRank.color}, transparent)` }}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 flex-shrink-0"
            style={{
              backgroundColor: overallRank.bgColor,
              borderColor: overallRank.color,
              boxShadow: `0 0 24px ${overallRank.color}40`,
            }}
          >
            <motion.span
              animate={{ filter: [`drop-shadow(0 0 0px ${overallRank.color})`, `drop-shadow(0 0 8px ${overallRank.color})`, `drop-shadow(0 0 2px ${overallRank.color})`] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            >
              {overallRank.icon}
            </motion.span>
          </div>
          <div>
            <p className="text-forge-white/40 text-xs uppercase tracking-wider">Rango Global</p>
            <h2 className="font-display text-3xl" style={{ color: overallRank.color }}>
              {overallRank.label.toUpperCase()}
            </h2>
            <p className="text-forge-white/40 text-xs mt-0.5">{totalXP.toLocaleString()} XP · {classifiedCount}/10 músculos</p>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 mx-4 mb-4 bg-forge-iron rounded-xl p-1">
        {[
          { id: 'body' as const, label: 'Vista corporal' },
          { id: 'list' as const, label: 'Lista detallada' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v.id ? 'bg-forge-orange text-white' : 'text-forge-white/50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Body SVG view */}
      {view === 'body' && (
        <div className="flex flex-col items-center px-4 gap-4">
          <BodySVG
            muscleRanks={muscleRanks}
            onMuscleClick={handleMuscleClick}
            selectedMuscle={selectedMuscle}
          />

          {/* Selected muscle detail */}
          <AnimatePresence>
            {selectedRank && selectedMuscle && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="w-full card-metal p-4 overflow-hidden"
                style={{ borderColor: `${RANK_DATA[selectedRank.tier].color}40` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
                      style={{
                        backgroundColor: RANK_DATA[selectedRank.tier].bgColor,
                        borderColor: `${RANK_DATA[selectedRank.tier].color}50`,
                        color: RANK_DATA[selectedRank.tier].color,
                      }}
                    >
                      {RANK_DATA[selectedRank.tier].icon}
                    </div>
                    <div>
                      <div className="font-bold text-forge-white capitalize">{selectedMuscle}</div>
                      <div className="text-xs font-semibold" style={{ color: RANK_DATA[selectedRank.tier].color }}>
                        {RANK_DATA[selectedRank.tier].label} · {Math.round(selectedRank.percentile)}%
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMuscle(null)} className="text-forge-white/30">
                    <X size={16} />
                  </button>
                </div>

                {selectedRank.oneRM > 0 ? (
                  <>
                    <div className="flex gap-4 mb-3">
                      <div className="flex-1 text-center bg-forge-black rounded-xl p-2">
                        <div className="font-mono font-bold text-forge-white">{selectedRank.oneRM}kg</div>
                        <div className="text-xs text-forge-white/40">1RM est.</div>
                      </div>
                      <div className="flex-1 text-center bg-forge-black rounded-xl p-2">
                        <div className="font-mono font-bold text-forge-orange">{selectedRank.xp}</div>
                        <div className="text-xs text-forge-white/40">XP</div>
                      </div>
                    </div>
                    {(() => {
                      const nextTierIdx = RANK_ORDER.indexOf(selectedRank.tier) + 1
                      const nextTier = nextTierIdx < RANK_ORDER.length ? RANK_ORDER[nextTierIdx] : null
                      const progress = getRankProgress(selectedRank.percentile, selectedRank.tier)
                      return nextTier ? (
                        <div>
                          <div className="flex justify-between text-xs text-forge-white/40 mb-1">
                            <span>{RANK_DATA[selectedRank.tier].label}</span>
                            <span>{RANK_DATA[nextTier].label}</span>
                          </div>
                          <ProgressBar value={progress} color={RANK_DATA[selectedRank.tier].color} bgColor="#2A2A30" height={6} />
                        </div>
                      ) : null
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-forge-white/40 text-center py-2">
                    Registra un ejercicio de {selectedMuscle} para clasificar
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="px-4">
          <div className="flex flex-col gap-3">
            {muscleRanks.map((rank) => {
              const rankData = RANK_DATA[rank.tier]
              const progress = getRankProgress(rank.percentile, rank.tier)
              const nextTierIdx = RANK_ORDER.indexOf(rank.tier) + 1
              const nextTier = nextTierIdx < RANK_ORDER.length ? RANK_ORDER[nextTierIdx] : null

              return (
                <motion.button
                  key={rank.muscle}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMuscleClick(rank.muscle)}
                  className={`card-metal p-4 text-left transition-all ${selectedMuscle === rank.muscle ? 'border-forge-orange/40' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border"
                      style={{
                        backgroundColor: rankData.bgColor,
                        borderColor: `${rankData.color}40`,
                        color: rankData.color,
                      }}
                    >
                      {rankData.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-forge-white capitalize">{rank.muscle}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: rankData.color }}>{rankData.label}</span>
                          <ChevronRight size={14} className="text-forge-white/30" />
                        </div>
                      </div>
                      {rank.oneRM > 0 ? (
                        <span className="text-xs text-forge-white/40">{rank.oneRM}kg 1RM · {Math.round(rank.percentile)}%</span>
                      ) : (
                        <span className="text-xs text-forge-white/25">Sin datos · Registra un entreno</span>
                      )}
                    </div>
                  </div>
                  <ProgressBar value={progress} color={rankData.color} bgColor="#2A2A30" height={4} />
                  {nextTier && (
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-forge-white/25">{rankData.label}</span>
                      <span className="text-xs text-forge-white/25">{RANK_DATA[nextTier].label}</span>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Rank legend */}
      <div className="mx-4 mt-6">
        <div className="card-metal p-4">
          <h3 className="font-semibold text-forge-white mb-3 flex items-center gap-2 text-sm">
            <Trophy size={14} className="text-forge-orange" />
            Escala de rangos FORGE
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {RANK_ORDER.map((tier) => {
              const r = RANK_DATA[tier]
              const isCurrent = overallTier === tier
              return (
                <div key={tier} className={`flex items-center gap-2 ${isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                  <span style={{ color: r.color }} className="text-base">{r.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-forge-white">{r.label}</div>
                    <div className="text-xs text-forge-white/30">Top {100 - r.minPercentile}%</div>
                  </div>
                  {isCurrent && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-forge-orange" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RanksPage
