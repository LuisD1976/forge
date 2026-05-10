import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersonalRecord } from '../types'
import { supabase } from '../lib/supabase'
import { estimateOneRM } from '../utils/rankCalculator'

interface PRState {
  records: PersonalRecord[]
  checkAndUpdatePR: (exerciseId: string, exerciseName: string, weight: number, reps: number) => PersonalRecord | null
  getRecord: (exerciseId: string) => PersonalRecord | undefined
  loadFromSupabase: (userId: string) => Promise<void>
}

export const usePRStore = create<PRState>()(
  persist(
    (set, get) => ({
      records: [],

      checkAndUpdatePR: (exerciseId, exerciseName, weight, reps) => {
        if (weight <= 0 || reps <= 0) return null
        const oneRM = estimateOneRM(weight, reps)
        const existing = get().records.find((r) => r.exerciseId === exerciseId)
        if (existing && oneRM <= existing.oneRM) return null

        const newPR: PersonalRecord = {
          exerciseId,
          exerciseName,
          weight,
          reps,
          oneRM,
          date: new Date().toISOString(),
        }
        set((state) => ({
          records: [newPR, ...state.records.filter((r) => r.exerciseId !== exerciseId)],
        }))

        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          supabase.from('personal_records').upsert({
            user_id: user.id,
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            weight,
            reps,
            one_rm: oneRM,
            date: newPR.date,
          } as never, { onConflict: 'user_id,exercise_id' }).then(null, console.error)
        })

        return newPR
      },

      getRecord: (exerciseId) => get().records.find((r) => r.exerciseId === exerciseId),

      loadFromSupabase: async (userId) => {
        const { data } = await supabase
          .from('personal_records')
          .select('*')
          .eq('user_id', userId)
        if (!data) return
        set({
          records: (data as any[]).map((r) => ({
            exerciseId: r.exercise_id,
            exerciseName: r.exercise_name,
            weight: r.weight,
            reps: r.reps,
            oneRM: r.one_rm,
            date: r.date,
          })),
        })
      },
    }),
    { name: 'forge-prs' }
  )
)
