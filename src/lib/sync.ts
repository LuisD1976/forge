import { supabase } from './supabase'
import type { WorkoutSession, MuscleRank } from '../types'

export async function syncWorkoutSession(session: WorkoutSession, userId: string) {
  await supabase.from('workout_sessions').upsert({
    id: session.id,
    user_id: userId,
    name: session.name,
    date: session.date,
    duration: session.duration,
    exercises: session.exercises as never,
    total_volume: session.totalVolume,
    xp_gained: session.xpGained,
    notes: session.notes ?? null,
  } as never, { onConflict: 'id' })
}

export async function syncMuscleRanks(ranks: MuscleRank[], userId: string) {
  const rows = ranks.map((r) => ({
    user_id: userId,
    muscle: r.muscle,
    tier: r.tier,
    percentile: r.percentile,
    one_rm: r.oneRM,
    xp: r.xp,
    next_level_xp: r.nextLevelXp,
  }))
  await supabase.from('muscle_ranks').upsert(rows as never, { onConflict: 'user_id,muscle' })
}

export async function loadUserWorkouts(userId: string): Promise<WorkoutSession[]> {
  const { data } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(100)
  if (!data) return []
  return (data as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    date: r.date,
    duration: r.duration,
    exercises: r.exercises,
    totalVolume: r.total_volume,
    xpGained: r.xp_gained,
    notes: r.notes ?? undefined,
  }))
}

export async function loadMuscleRanks(userId: string): Promise<MuscleRank[]> {
  const { data } = await supabase
    .from('muscle_ranks')
    .select('*')
    .eq('user_id', userId)
  if (!data) return []
  return (data as any[]).map((r) => ({
    muscle: r.muscle,
    tier: r.tier,
    percentile: r.percentile,
    oneRM: r.one_rm,
    xp: r.xp,
    nextLevelXp: r.next_level_xp,
  }))
}
