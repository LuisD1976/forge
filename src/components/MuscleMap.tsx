import React from 'react'
import type { MuscleRank } from '../types'
import { RANK_DATA } from '../data/ranks'

interface MuscleMapProps {
  muscleRanks: MuscleRank[]
  onMuscleClick?: (muscle: string) => void
}


export const MuscleMap: React.FC<MuscleMapProps> = ({ muscleRanks, onMuscleClick }) => {
  const getRankColor = (muscleName: string): string => {
    const rank = muscleRanks.find((r) => r.muscle === muscleName)
    if (!rank || rank.oneRM === 0) return '#2A2A30'
    return RANK_DATA[rank.tier].color
  }

  const muscleGroups = ['pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'cuadriceps', 'isquiotibiales', 'gluteos', 'gemelos', 'abdominales']

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2">
        {muscleGroups.map((muscle) => {
          const rank = muscleRanks.find((r) => r.muscle === muscle)
          const color = getRankColor(muscle)
          const hasData = rank && rank.oneRM > 0

          return (
            <button
              key={muscle}
              onClick={() => onMuscleClick?.(muscle)}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95"
              style={{
                backgroundColor: hasData ? `${color}15` : '#18181C',
                borderColor: hasData ? `${color}40` : '#2A2A30',
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: color,
                  boxShadow: hasData ? `0 0 6px ${color}` : 'none',
                }}
              />
              <div className="text-left">
                <div className="text-sm font-medium text-forge-white capitalize">{muscle}</div>
                {hasData && rank ? (
                  <div className="text-xs" style={{ color }}>
                    {RANK_DATA[rank.tier].label} • {Math.round(rank.percentile)}%
                  </div>
                ) : (
                  <div className="text-xs text-forge-white/30">Sin clasificar</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MuscleMap
