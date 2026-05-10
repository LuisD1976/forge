import type { RankTier } from '../types'
import { RANK_DATA, RANK_ORDER } from '../data/ranks'

export function getNextTier(current: RankTier): RankTier | null {
  const idx = RANK_ORDER.indexOf(current)
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null
}

export function getPrevTier(current: RankTier): RankTier | null {
  const idx = RANK_ORDER.indexOf(current)
  return idx > 0 ? RANK_ORDER[idx - 1] : null
}

export function getRankProgress(percentile: number, tier: RankTier): number {
  const data = RANK_DATA[tier]
  const range = data.maxPercentile - data.minPercentile
  if (range === 0) return 100
  return Math.min(100, Math.max(0, ((percentile - data.minPercentile) / range) * 100))
}

export function estimateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export function calculateXPForSet(weight: number, reps: number, sets: number): number {
  const volume = weight * reps * sets
  return Math.round(volume / 50)
}
