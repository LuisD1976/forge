import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useWorkoutStore } from '../store/workoutStore'
import { useRanksStore } from '../store/ranksStore'
import type { WorkoutSession, MuscleRank } from '../types'

export function useWorkoutRealtime(userId?: string) {
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`forge-workout-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'workout_sessions', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as {
            id: string; name: string; date: string; duration: number
            exercises: unknown; total_volume: number; xp_gained: number; notes: string | null
          }
          const session: WorkoutSession = {
            id: row.id, name: row.name, date: row.date, duration: row.duration,
            exercises: row.exercises as WorkoutSession['exercises'],
            totalVolume: row.total_volume, xpGained: row.xp_gained,
            notes: row.notes ?? undefined,
          }
          const current = useWorkoutStore.getState().sessions
          if (!current.some((s) => s.id === session.id)) {
            useWorkoutStore.getState().loadSessions([session, ...current])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'muscle_ranks', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as {
            muscle: string; tier: string; percentile: number
            one_rm: number; xp: number; next_level_xp: number
          } | null
          if (!row) return
          const current = useRanksStore.getState().muscleRanks
          const updated = current.map((r) =>
            r.muscle === row.muscle
              ? {
                  ...r,
                  tier: row.tier as MuscleRank['tier'],
                  percentile: row.percentile,
                  oneRM: row.one_rm,
                  xp: row.xp,
                  nextLevelXp: row.next_level_xp,
                }
              : r
          )
          useRanksStore.getState().loadRanks(updated)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
