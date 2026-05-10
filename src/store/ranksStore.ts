import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MuscleRank, MuscleGroup, RankTier } from '../types'

interface RanksState {
  muscleRanks: MuscleRank[]
  totalXP: number
  initRanks: () => void
  updateRank: (muscle: MuscleGroup, oneRM: number) => void
  addXP: (muscle: MuscleGroup, xp: number) => void
  getOverallTier: () => RankTier
  getClassifiedCount: () => number
}

const MUSCLES: MuscleGroup[] = [
  'pecho', 'espalda', 'hombros', 'biceps', 'triceps',
  'cuadriceps', 'isquiotibiales', 'gluteos', 'gemelos', 'abdominales',
]

function percentileToTier(percentile: number): RankTier {
  if (percentile >= 99) return 'leyenda'
  if (percentile >= 95) return 'diamante'
  if (percentile >= 90) return 'platino'
  if (percentile >= 80) return 'titanio'
  if (percentile >= 65) return 'oro'
  if (percentile >= 50) return 'plata'
  if (percentile >= 35) return 'cobre'
  if (percentile >= 20) return 'acero'
  if (percentile >= 10) return 'bronce'
  return 'hierro'
}

const initialRanks: MuscleRank[] = MUSCLES.map((muscle) => ({
  muscle,
  tier: 'hierro',
  percentile: 5,
  oneRM: 0,
  xp: 0,
  nextLevelXp: 500,
}))

export const useRanksStore = create<RanksState>()(
  persist(
    (set, get) => ({
      muscleRanks: initialRanks,
      totalXP: 0,

      initRanks: () => set({ muscleRanks: initialRanks }),

      updateRank: (muscle, oneRM) =>
        set((state) => {
          const percentile = Math.min(99, Math.max(1, (oneRM / 200) * 100))
          const tier = percentileToTier(percentile)
          return {
            muscleRanks: state.muscleRanks.map((r) =>
              r.muscle === muscle ? { ...r, oneRM, percentile, tier } : r
            ),
          }
        }),

      addXP: (muscle, xp) =>
        set((state) => {
          const updated = state.muscleRanks.map((r) => {
            if (r.muscle !== muscle) return r
            const newXP = r.xp + xp
            const newPercentile = Math.min(99, r.percentile + xp / 100)
            const tier = percentileToTier(newPercentile)
            return { ...r, xp: newXP, percentile: newPercentile, tier }
          })
          return { muscleRanks: updated, totalXP: state.totalXP + xp }
        }),

      getOverallTier: () => {
        const { muscleRanks } = get()
        if (!muscleRanks.length) return 'hierro'
        const avgPercentile = muscleRanks.reduce((s, r) => s + r.percentile, 0) / muscleRanks.length
        return percentileToTier(avgPercentile)
      },

      getClassifiedCount: () => {
        const { muscleRanks } = get()
        return muscleRanks.filter((r) => r.oneRM > 0).length
      },
    }),
    { name: 'forge-ranks' }
  )
)
