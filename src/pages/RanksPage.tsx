import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Dumbbell } from 'lucide-react'
import { useRanksStore } from '../store/ranksStore'
import { RANK_DATA, RANK_ORDER } from '../data/ranks'
import { getRankProgress } from '../utils/rankCalculator'
import { ProgressBar } from '../components/ProgressBar'
import type { MuscleGroup, MuscleRank } from '../types'


const MUSCLE_DISPLAY: Record<string, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdominales: 'Abdominales',
  cuadriceps: 'Cuádriceps',
  isquiotibiales: 'Isquiotibiales',
  gluteos: 'Glúteos',
  gemelos: 'Gemelos',
  trapecio: 'Trapecio',
  antebrazos: 'Antebrazos',
}

// ── Gem badge SVG ─────────────────────────────────────────────
function RankGem({ color, icon, size = 80 }: { color: string; icon: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl relative"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 35% 30%, ${color}55, ${color}15 60%, transparent)`,
        border: `2px solid ${color}60`,
        boxShadow: `0 0 32px ${color}50, inset 0 1px 0 ${color}40`,
      }}
    >
      <span style={{ fontSize: size * 0.45, filter: `drop-shadow(0 0 8px ${color})` }}>{icon}</span>
    </div>
  )
}

// ── Rank progression strip ────────────────────────────────────
function RankStrip({ currentTier }: { currentTier: string }) {
  const currentIdx = RANK_ORDER.indexOf(currentTier as never)
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {RANK_ORDER.map((tier, i) => {
        const r = RANK_DATA[tier]
        const isCurrent = i === currentIdx
        const isPast = i < currentIdx
        return (
          <div key={tier} className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                width: isCurrent ? 32 : 22,
                height: isCurrent ? 32 : 22,
                background: isCurrent
                  ? `radial-gradient(circle, ${r.color}40, ${r.color}15)`
                  : isPast ? `${r.color}20` : 'rgba(255,255,255,0.04)',
                border: isCurrent ? `2px solid ${r.color}` : `1px solid ${isPast ? r.color + '50' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isCurrent ? `0 0 12px ${r.color}60` : 'none',
              }}
            >
              <span style={{ fontSize: isCurrent ? 16 : 11, opacity: isPast ? 0.7 : isCurrent ? 1 : 0.25 }}>
                {r.icon}
              </span>
            </div>
            {i < RANK_ORDER.length - 1 && (
              <div
                className="h-px flex-shrink-0"
                style={{ width: 8, backgroundColor: isPast ? `${r.color}50` : 'rgba(255,255,255,0.08)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Mini body SVG (front + back) ──────────────────────────────
const FRONT_MUSCLES_MINI: { id: MuscleGroup; paths: string[] }[] = [
  { id: 'pecho', paths: ['M38,48 Q52,45 55,68 Q44,74 34,68 Z', 'M72,48 Q58,45 55,68 Q66,74 76,68 Z'] },
  { id: 'hombros', paths: ['M26,44 Q14,52 14,66 Q20,72 30,68 L34,52 Z', 'M84,44 Q96,52 96,66 Q90,72 80,68 L76,52 Z'] },
  { id: 'biceps', paths: ['M16,68 Q10,84 12,104 Q19,108 26,103 Q30,82 24,68 Z', 'M94,68 Q100,84 98,104 Q91,108 84,103 Q80,82 86,68 Z'] },
  { id: 'abdominales', paths: ['M42,80 L52,80 L52,92 L42,92 Z', 'M58,80 L68,80 L68,92 L58,92 Z', 'M42,95 L52,95 L52,107 L42,107 Z', 'M58,95 L68,95 L68,107 L58,107 Z', 'M42,110 L52,110 L52,120 L42,120 Z', 'M58,110 L68,110 L68,120 L58,120 Z'] },
  { id: 'cuadriceps', paths: ['M34,138 Q36,145 34,200 L20,196 Q20,142 28,136 Z', 'M76,138 Q74,145 76,200 L90,196 Q90,142 82,136 Z'] },
  { id: 'gemelos', paths: ['M22,208 Q18,230 20,252 L32,252 Q34,230 32,208 Z', 'M88,208 Q92,230 90,252 L78,252 Q76,230 78,208 Z'] },
  { id: 'antebrazos', paths: ['M12,106 Q8,126 10,148 L18,148 L26,106 Z', 'M98,106 Q102,126 100,148 L92,148 L84,106 Z'] },
]

const BACK_MUSCLES_MINI: { id: MuscleGroup; paths: string[] }[] = [
  { id: 'espalda', paths: ['M35,42 Q16,68 20,125 L38,122 L42,76 Z', 'M75,42 Q94,68 90,125 L72,122 L68,76 Z'] },
  { id: 'trapecio', paths: ['M42,36 L68,36 L74,56 L55,50 L36,56 Z'] },
  { id: 'hombros', paths: ['M26,44 Q14,52 14,66 Q20,72 30,68 L34,52 Z', 'M84,44 Q96,52 96,66 Q90,72 80,68 L76,52 Z'] },
  { id: 'triceps', paths: ['M22,66 Q14,82 16,104 Q23,108 30,102 Q34,80 28,64 Z', 'M88,66 Q96,82 94,104 Q87,108 80,102 Q76,80 82,64 Z'] },
  { id: 'gluteos', paths: ['M28,138 Q20,152 24,165 Q36,170 46,162 Q50,148 44,136 Z', 'M82,138 Q90,152 86,165 Q74,170 64,162 Q60,148 66,136 Z'] },
  { id: 'isquiotibiales', paths: ['M24,168 Q22,182 24,210 L38,208 Q40,180 38,167 Z', 'M86,168 Q88,182 86,210 L72,208 Q70,180 72,167 Z'] },
  { id: 'gemelos', paths: ['M24,214 Q20,234 22,252 L34,252 Q36,234 34,214 Z', 'M86,214 Q90,234 88,252 L76,252 Q74,234 76,214 Z'] },
]

const BODY_PATH = `M55,2 Q42,2 40,14 Q38,24 40,28 L38,36 Q24,40 22,46 L14,44 Q8,50 10,68 Q10,76 16,78
  L10,108 Q8,130 10,150 L18,150 L18,108 Q22,112 26,110 L38,136 L28,200 L20,206
  L18,256 L32,256 L32,252 L22,252 L22,212 L34,208 L50,204 L50,136 L60,136 L60,204
  L76,208 L88,212 L88,252 L78,252 L78,256 L92,256 L92,206 L82,200 L72,136
  L84,110 Q88,112 92,108 L92,150 L100,150 Q102,130 100,108 L94,78 Q100,76 100,68
  Q102,50 96,44 L88,46 Q86,40 72,36 L70,28 Q72,24 70,14 Q68,2 55,2 Z`

function BodyMap({ muscleRanks, selectedMuscle, onMuscleClick }: {
  muscleRanks: MuscleRank[]
  selectedMuscle: MuscleGroup | null
  onMuscleClick: (m: MuscleGroup) => void
}) {
  const getColor = (id: MuscleGroup) => {
    const r = muscleRanks.find(m => m.muscle === id)
    if (!r || r.oneRM === 0) return '#2A2A35'
    return RANK_DATA[r.tier].color
  }
  const getOpacity = (id: MuscleGroup) => {
    if (selectedMuscle && selectedMuscle !== id) return 0.2
    const r = muscleRanks.find(m => m.muscle === id)
    if (!r || r.oneRM === 0) return 0.5
    return 0.9
  }

  const renderBody = (muscles: typeof FRONT_MUSCLES_MINI) => (
    <svg viewBox="0 0 110 260" width="130" height="300" xmlns="http://www.w3.org/2000/svg">
      <path d={BODY_PATH} fill="#18181F" stroke="#2A2A35" strokeWidth="1" />
      <circle cx="55" cy="16" r="14" fill="#18181F" stroke="#2A2A35" strokeWidth="1" />
      <rect x="49" y="29" width="12" height="8" rx="2" fill="#18181F" stroke="#2A2A35" strokeWidth="0.5" />
      {muscles.map(m => (
        <g key={m.id} onClick={() => onMuscleClick(m.id)} style={{ cursor: 'pointer' }}>
          {m.paths.map((p, i) => (
            <motion.path
              key={i} d={p}
              fill={getColor(m.id)}
              fillOpacity={getOpacity(m.id)}
              stroke={selectedMuscle === m.id ? getColor(m.id) : 'transparent'}
              strokeWidth={selectedMuscle === m.id ? 1.5 : 0}
              animate={{ fillOpacity: getOpacity(m.id) }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </g>
      ))}
    </svg>
  )

  return (
    <div className="flex justify-center gap-2">
      {renderBody(FRONT_MUSCLES_MINI)}
      {renderBody(BACK_MUSCLES_MINI)}
    </div>
  )
}

// ── Muscle row ────────────────────────────────────────────────
function MuscleRow({ rank, isOpen, onToggle }: { rank: MuscleRank; isOpen: boolean; onToggle: () => void }) {
  const rankData = RANK_DATA[rank.tier]
  const hasData = rank.oneRM > 0
  const nextTierIdx = RANK_ORDER.indexOf(rank.tier) + 1
  const nextTier = nextTierIdx < RANK_ORDER.length ? RANK_ORDER[nextTierIdx] : null
  const progress = getRankProgress(rank.percentile, rank.tier)

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl"
      style={{
        background: isOpen && hasData
          ? `linear-gradient(135deg, ${rankData.color}12, ${rankData.color}05)`
          : 'rgba(255,255,255,0.03)',
        border: isOpen && hasData
          ? `1px solid ${rankData.color}50`
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-4 text-left"
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: hasData
              ? `radial-gradient(circle, ${rankData.color}30, ${rankData.color}08)`
              : 'rgba(255,255,255,0.05)',
            border: hasData ? `1px solid ${rankData.color}40` : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Dumbbell
            size={20}
            style={{ color: hasData ? rankData.color : 'rgba(255,255,255,0.2)' }}
          />
        </div>

        {/* Name + rank */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-forge-white text-base">
            {MUSCLE_DISPLAY[rank.muscle] ?? rank.muscle}
          </div>
          <div
            className="text-xs font-semibold mt-0.5 uppercase tracking-wide"
            style={{ color: hasData ? rankData.color : 'rgba(255,255,255,0.2)' }}
          >
            {hasData ? rankData.label : 'SIN RANGO'}
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} style={{ color: hasData ? rankData.color : 'rgba(255,255,255,0.2)' }} />
        </motion.div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {hasData ? (
                <>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="font-mono font-bold text-forge-white text-lg">{rank.oneRM}kg</div>
                      <div className="text-xs text-forge-white/40 mt-0.5">1RM estimado</div>
                    </div>
                    <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="font-mono font-bold text-lg" style={{ color: rankData.color }}>{Math.round(rank.percentile)}%</div>
                      <div className="text-xs text-forge-white/40 mt-0.5">Percentil</div>
                    </div>
                    <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="font-mono font-bold text-forge-white text-lg">{rank.xp}</div>
                      <div className="text-xs text-forge-white/40 mt-0.5">XP</div>
                    </div>
                  </div>
                  {nextTier && (
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span style={{ color: rankData.color }}>{rankData.label}</span>
                        <span className="text-forge-white/30">{RANK_DATA[nextTier].label}</span>
                      </div>
                      <ProgressBar value={progress} color={rankData.color} bgColor="rgba(255,255,255,0.06)" height={5} />
                    </div>
                  )}
                </>
              ) : (
                <div className="py-2 text-center text-sm text-forge-white/30">
                  Registra un ejercicio de {MUSCLE_DISPLAY[rank.muscle] ?? rank.muscle} para clasificar
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export const RanksPage: React.FC = () => {
  const { muscleRanks, totalXP, getOverallTier, getClassifiedCount } = useRanksStore()
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [openMuscle, setOpenMuscle] = useState<MuscleGroup | null>(null)

  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const classifiedCount = getClassifiedCount()
  const unclassified = muscleRanks.length - classifiedCount
  const topPercent = Math.max(1, 100 - Math.round(muscleRanks.reduce((acc, r) => acc + r.percentile, 0) / muscleRanks.length))

  const toggleMuscle = (muscle: MuscleGroup) => {
    setOpenMuscle(prev => prev === muscle ? null : muscle)
    setSelectedMuscle(muscle)
  }

  return (
    <div className="flex flex-col pb-28" style={{ background: '#0D0D0F', minHeight: '100vh' }}>

      {/* ── Hero card ── */}
      <div className="mx-4 mt-12 mb-5">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${overallRank.color}18 0%, rgba(13,13,15,0.9) 60%)`,
            border: `1.5px solid ${overallRank.color}35`,
            boxShadow: `0 8px 40px ${overallRank.color}20`,
          }}
        >
          {/* Glow top-right */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${overallRank.color}25, transparent 70%)` }}
          />

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: `${overallRank.color}80` }}
              >
                Rango Global
              </p>
              <motion.h1
                className="font-display leading-none mb-1"
                style={{ fontSize: 44, color: overallRank.color }}
                animate={{ textShadow: [`0 0 0px ${overallRank.color}`, `0 0 20px ${overallRank.color}60`, `0 0 0px ${overallRank.color}`] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {overallRank.label.toUpperCase()}
              </motion.h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {totalXP > 0 ? `¿Eres parte del top ${topPercent}%?` : 'Registra entrenos para clasificar'}
              </p>
            </div>
            <RankGem color={overallRank.color} icon={overallRank.icon} size={72} />
          </div>

          {/* Rank strip */}
          <RankStrip currentTier={overallTier} />

          {/* Classify CTA */}
          {unclassified > 0 && (
            <motion.div
              className="mt-4 rounded-2xl flex items-center justify-between px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <span className="font-semibold text-forge-white text-sm">Clasificar músculos</span>
                <span className="text-forge-white/40 text-sm"> · {unclassified} restantes</span>
              </div>
              <ChevronRight size={16} className="text-forge-white/40" />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Body map ── */}
      <div
        className="mx-4 mb-5 rounded-3xl p-4"
        style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-forge-white/30 mb-3 text-center">
          Mapa Muscular
        </p>
        <BodyMap
          muscleRanks={muscleRanks}
          selectedMuscle={selectedMuscle}
          onMuscleClick={(m) => setSelectedMuscle(prev => prev === m ? null : m)}
        />
        {selectedMuscle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs mt-2"
            style={{ color: RANK_DATA[muscleRanks.find(r => r.muscle === selectedMuscle)?.tier ?? 'hierro'].color }}
          >
            {MUSCLE_DISPLAY[selectedMuscle]} ·{' '}
            {(() => {
              const r = muscleRanks.find(m => m.muscle === selectedMuscle)
              return r && r.oneRM > 0 ? RANK_DATA[r.tier].label : 'Sin clasificar'
            })()}
          </motion.p>
        )}
      </div>

      {/* ── Muscle list ── */}
      <div className="px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-forge-white/30 mb-3">
          Rankings Musculares
        </p>
        <div className="flex flex-col gap-2">
          {[...muscleRanks]
            .sort((a, b) => b.percentile - a.percentile)
            .map(rank => (
              <MuscleRow
                key={rank.muscle}
                rank={rank}
                isOpen={openMuscle === rank.muscle}
                onToggle={() => toggleMuscle(rank.muscle)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

export default RanksPage
