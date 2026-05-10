import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { checkAchievements, type Achievement, type AchievementStats } from '../data/achievements'

interface AchievementsState {
  unlockedIds: string[]
  queue: Achievement[]
  unlock: (stats: AchievementStats) => Achievement[]
  dismissFirst: () => void
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      queue: [],

      unlock: (stats) => {
        const { unlockedIds } = get()
        const newOnes = checkAchievements(stats, unlockedIds)
        if (newOnes.length === 0) return []
        set((state) => ({
          unlockedIds: [...state.unlockedIds, ...newOnes.map((a) => a.id)],
          queue: [...state.queue, ...newOnes],
        }))
        return newOnes
      },

      dismissFirst: () => set((state) => ({ queue: state.queue.slice(1) })),
    }),
    { name: 'forge-achievements' }
  )
)
