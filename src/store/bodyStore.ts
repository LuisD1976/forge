import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BodyMeasurement } from '../types'
import { supabase } from '../lib/supabase'

interface BodyState {
  measurements: BodyMeasurement[]
  addMeasurement: (m: Omit<BodyMeasurement, 'id'>) => Promise<void>
  getLatest: () => BodyMeasurement | null
  getWeightHistory: (days?: number) => { date: string; weight: number }[]
  loadFromSupabase: (userId: string) => Promise<void>
}

export const useBodyStore = create<BodyState>()(
  persist(
    (set, get) => ({
      measurements: [],

      addMeasurement: async (m) => {
        const measurement: BodyMeasurement = { ...m, id: crypto.randomUUID() }
        set((state) => ({ measurements: [measurement, ...state.measurements] }))
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        supabase.from('body_measurements').insert({
          id: measurement.id,
          user_id: user.id,
          date: measurement.date,
          weight: measurement.weight ?? null,
          height: measurement.height ?? null,
          body_fat: measurement.bodyFat ?? null,
          waist: measurement.waist ?? null,
          chest: measurement.chest ?? null,
          arms: measurement.arms ?? null,
          hips: measurement.hips ?? null,
          thighs: measurement.thighs ?? null,
        } as never).then(null, console.error)
      },

      getLatest: () => {
        const { measurements } = get()
        return measurements[0] ?? null
      },

      getWeightHistory: (days = 60) => {
        const { measurements } = get()
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        return measurements
          .filter((m) => m.weight && new Date(m.date) >= cutoff)
          .map((m) => ({
            date: new Date(m.date).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
            weight: m.weight!,
          }))
          .reverse()
      },

      loadFromSupabase: async (userId) => {
        const { data } = await supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(100)
        if (!data) return
        set({
          measurements: (data as any[]).map((r) => ({
            id: r.id,
            date: r.date,
            weight: r.weight ?? undefined,
            height: r.height ?? undefined,
            bodyFat: r.body_fat ?? undefined,
            waist: r.waist ?? undefined,
            chest: r.chest ?? undefined,
            arms: r.arms ?? undefined,
            hips: r.hips ?? undefined,
            thighs: r.thighs ?? undefined,
          })),
        })
      },
    }),
    { name: 'forge-body' }
  )
)
