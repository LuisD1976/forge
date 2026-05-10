import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { MuscleRank, MuscleGroup } from '../types'
import { RANK_DATA } from '../data/ranks'

interface BodySVGProps {
  muscleRanks: MuscleRank[]
  onMuscleClick?: (muscle: MuscleGroup) => void
  selectedMuscle?: MuscleGroup | null
}

type View = 'front' | 'back'

const FRONT_MUSCLES: { id: MuscleGroup; label: string; paths: string[] }[] = [
  {
    id: 'pecho',
    label: 'Pecho',
    paths: [
      'M38,48 Q52,45 55,68 Q44,74 34,68 Z',
      'M72,48 Q58,45 55,68 Q66,74 76,68 Z',
    ],
  },
  {
    id: 'hombros',
    label: 'Hombros',
    paths: [
      'M26,44 Q14,52 14,66 Q20,72 30,68 L34,52 Z',
      'M84,44 Q96,52 96,66 Q90,72 80,68 L76,52 Z',
    ],
  },
  {
    id: 'biceps',
    label: 'Bíceps',
    paths: [
      'M16,68 Q10,84 12,104 Q19,108 26,103 Q30,82 24,68 Z',
      'M94,68 Q100,84 98,104 Q91,108 84,103 Q80,82 86,68 Z',
    ],
  },
  {
    id: 'abdominales',
    label: 'Abdominales',
    paths: [
      'M42,80 L52,80 L52,92 L42,92 Z',
      'M58,80 L68,80 L68,92 L58,92 Z',
      'M42,95 L52,95 L52,107 L42,107 Z',
      'M58,95 L68,95 L68,107 L58,107 Z',
      'M42,110 L52,110 L52,120 L42,120 Z',
      'M58,110 L68,110 L68,120 L58,120 Z',
    ],
  },
  {
    id: 'cuadriceps',
    label: 'Cuádriceps',
    paths: [
      'M34,138 Q36,145 34,200 L20,196 Q20,142 28,136 Z',
      'M76,138 Q74,145 76,200 L90,196 Q90,142 82,136 Z',
    ],
  },
  {
    id: 'gemelos',
    label: 'Gemelos',
    paths: [
      'M22,208 Q18,230 20,252 L32,252 Q34,230 32,208 Z',
      'M88,208 Q92,230 90,252 L78,252 Q76,230 78,208 Z',
    ],
  },
  {
    id: 'antebrazos',
    label: 'Antebrazos',
    paths: [
      'M12,106 Q8,126 10,148 L18,148 L26,106 Z',
      'M98,106 Q102,126 100,148 L92,148 L84,106 Z',
    ],
  },
]

const BACK_MUSCLES: { id: MuscleGroup; label: string; paths: string[] }[] = [
  {
    id: 'espalda',
    label: 'Espalda',
    paths: [
      'M35,42 Q16,68 20,125 L38,122 L42,76 Z',
      'M75,42 Q94,68 90,125 L72,122 L68,76 Z',
    ],
  },
  {
    id: 'trapecio',
    label: 'Trapecio',
    paths: [
      'M42,36 L68,36 L74,56 L55,50 L36,56 Z',
    ],
  },
  {
    id: 'hombros',
    label: 'Hombros',
    paths: [
      'M26,44 Q14,52 14,66 Q20,72 30,68 L34,52 Z',
      'M84,44 Q96,52 96,66 Q90,72 80,68 L76,52 Z',
    ],
  },
  {
    id: 'triceps',
    label: 'Tríceps',
    paths: [
      'M22,66 Q14,82 16,104 Q23,108 30,102 Q34,80 28,64 Z',
      'M88,66 Q96,82 94,104 Q87,108 80,102 Q76,80 82,64 Z',
    ],
  },
  {
    id: 'gluteos',
    label: 'Glúteos',
    paths: [
      'M28,138 Q20,152 24,165 Q36,170 46,162 Q50,148 44,136 Z',
      'M82,138 Q90,152 86,165 Q74,170 64,162 Q60,148 66,136 Z',
    ],
  },
  {
    id: 'isquiotibiales',
    label: 'Isquiotibiales',
    paths: [
      'M24,168 Q22,182 24,210 L38,208 Q40,180 38,167 Z',
      'M86,168 Q88,182 86,210 L72,208 Q70,180 72,167 Z',
    ],
  },
  {
    id: 'gemelos',
    label: 'Gemelos',
    paths: [
      'M24,214 Q20,234 22,252 L34,252 Q36,234 34,214 Z',
      'M86,214 Q90,234 88,252 L76,252 Q74,234 76,214 Z',
    ],
  },
]

// Body silhouette paths
const BODY_FRONT = `
  M55,2 Q42,2 40,14 Q38,24 40,28 L38,36 Q24,40 22,46 L14,44 Q8,50 10,68 Q10,76 16,78
  L10,108 Q8,130 10,150 L18,150 L18,108 Q22,112 26,110 L38,136 L28,200 L20,206
  L18,256 L32,256 L32,252 L22,252 L22,212 L34,208 L50,204 L50,136 L60,136 L60,204
  L76,208 L88,212 L88,252 L78,252 L78,256 L92,256 L92,206 L82,200 L72,136
  L84,110 Q88,112 92,108 L92,150 L100,150 Q102,130 100,108 L94,78 Q100,76 100,68
  Q102,50 96,44 L88,46 Q86,40 72,36 L70,28 Q72,24 70,14 Q68,2 55,2 Z
`

const BODY_BACK = `
  M55,2 Q42,2 40,14 Q38,24 40,28 L38,36 Q24,40 22,46 L14,44 Q8,50 10,68 Q10,76 16,78
  L10,108 Q8,130 10,150 L18,150 L18,108 Q22,112 26,110 L38,136 L28,200 L20,206
  L18,256 L32,256 L32,252 L22,252 L22,212 L34,208 L50,204 L50,136 L60,136 L60,204
  L76,208 L88,212 L88,252 L78,252 L78,256 L92,256 L92,206 L82,200 L72,136
  L84,110 Q88,112 92,108 L92,150 L100,150 Q102,130 100,108 L94,78 Q100,76 100,68
  Q102,50 96,44 L88,46 Q86,40 72,36 L70,28 Q72,24 70,14 Q68,2 55,2 Z
`

export const BodySVG: React.FC<BodySVGProps> = ({ muscleRanks, onMuscleClick, selectedMuscle }) => {
  const [view, setView] = useState<View>('front')

  const getMuscleColor = (muscleId: MuscleGroup): string => {
    const rank = muscleRanks.find((r) => r.muscle === muscleId)
    if (!rank || rank.oneRM === 0) return '#2A2A30'
    return RANK_DATA[rank.tier].color
  }

  const getMuscleOpacity = (muscleId: MuscleGroup): number => {
    if (selectedMuscle && selectedMuscle !== muscleId) return 0.3
    const rank = muscleRanks.find((r) => r.muscle === muscleId)
    if (!rank || rank.oneRM === 0) return 0.4
    return 0.85
  }

  const currentMuscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle */}
      <div className="flex gap-1 bg-forge-iron rounded-xl p-1">
        {(['front', 'back'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === v ? 'bg-forge-orange text-white' : 'text-forge-white/50 hover:text-forge-white'
            }`}
          >
            {v === 'front' ? 'Frontal' : 'Dorsal'}
          </button>
        ))}
      </div>

      {/* SVG Body */}
      <div className="relative">
        <svg
          viewBox="0 0 110 260"
          width="160"
          height="370"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body silhouette */}
          <path
            d={view === 'front' ? BODY_FRONT : BODY_BACK}
            fill="#1E1E24"
            stroke="#2A2A30"
            strokeWidth="0.8"
          />

          {/* Head */}
          <circle cx="55" cy="16" r="14" fill="#1E1E24" stroke="#2A2A30" strokeWidth="0.8" />

          {/* Neck */}
          <rect x="49" y="29" width="12" height="8" rx="2" fill="#1E1E24" stroke="#2A2A30" strokeWidth="0.5" />

          {/* Muscle groups */}
          {currentMuscles.map((muscle) => {
            const color = getMuscleColor(muscle.id)
            const opacity = getMuscleOpacity(muscle.id)
            const isSelected = selectedMuscle === muscle.id

            return (
              <g
                key={muscle.id}
                onClick={() => onMuscleClick?.(muscle.id)}
                style={{ cursor: 'pointer' }}
              >
                {muscle.paths.map((path, i) => (
                  <motion.path
                    key={i}
                    d={path}
                    fill={color}
                    fillOpacity={opacity}
                    stroke={isSelected ? color : 'transparent'}
                    strokeWidth={isSelected ? 1 : 0}
                    animate={{
                      fillOpacity: opacity,
                      filter: isSelected ? `drop-shadow(0 0 3px ${color})` : 'none',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </g>
            )
          })}

        </svg>

        {/* Glowing effect overlay for selected */}
        {selectedMuscle && (
          <div
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${getMuscleColor(selectedMuscle)}15, transparent 60%)`,
            }}
          />
        )}
      </div>

      {/* Muscle legend */}
      <div className="grid grid-cols-2 gap-1.5 w-full max-w-xs">
        {currentMuscles.map((muscle) => {
          const rank = muscleRanks.find((r) => r.muscle === muscle.id)
          const color = getMuscleColor(muscle.id)
          const rankData = rank ? RANK_DATA[rank.tier] : null
          const hasData = (rank?.oneRM ?? 0) > 0
          const isSelected = selectedMuscle === muscle.id

          return (
            <button
              key={muscle.id}
              onClick={() => onMuscleClick?.(muscle.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                isSelected ? 'bg-forge-border' : 'hover:bg-forge-border/50'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: color,
                  boxShadow: hasData ? `0 0 5px ${color}80` : 'none',
                }}
              />
              <div className="min-w-0">
                <div className="text-xs text-forge-white capitalize truncate">{muscle.label}</div>
                {hasData && rankData ? (
                  <div className="text-xs font-semibold truncate" style={{ color }}>
                    {rankData.label}
                  </div>
                ) : (
                  <div className="text-xs text-forge-white/25">Sin datos</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BodySVG
