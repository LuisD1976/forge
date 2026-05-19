import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { syncWeeklyPlan, deleteWeeklyPlan, loadUserWeeklyPlans } from '../lib/sync'

export type WeekDay = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export const WEEK_DAYS: WeekDay[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  lunes: 'L', martes: 'M', miercoles: 'X', jueves: 'J', viernes: 'V', sabado: 'S', domingo: 'D',
}
export const WEEK_DAY_FULL: Record<WeekDay, string> = {
  lunes: 'LUNES', martes: 'MARTES', miercoles: 'MIÉRCOLES', jueves: 'JUEVES',
  viernes: 'VIERNES', sabado: 'SÁBADO', domingo: 'DOMINGO',
}

export interface WeeklyPlan {
  id: string
  name: string
  equipment: string
  assignments: Partial<Record<WeekDay, string>> // day -> routineId
  isActive: boolean
  createdAt: string
}

interface WeeklyPlanState {
  plans: WeeklyPlan[]
  addPlan: (plan: Omit<WeeklyPlan, 'id' | 'createdAt'>) => WeeklyPlan
  updatePlan: (id: string, updates: Partial<WeeklyPlan>) => void
  deletePlan: (id: string) => void
  setActivePlan: (id: string) => void
  getActivePlan: () => WeeklyPlan | null
  getTodayRoutineId: () => string | null
  loadFromSupabase: (userId: string) => Promise<void>
}

function getTodayKey(): WeekDay {
  const days: WeekDay[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return days[new Date().getDay()]
}

export const useWeeklyPlanStore = create<WeeklyPlanState>()(
  persist(
    (set, get) => ({

      plans: [],

      addPlan: (plan) => {
        const newPlan: WeeklyPlan = { ...plan, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
        set(s => ({ plans: [...s.plans, newPlan] }))
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) syncWeeklyPlan(newPlan, user.id).catch(console.error)
        })
        return newPlan
      },

      updatePlan: (id, updates) => {
        set(s => ({ plans: s.plans.map(p => p.id === id ? { ...p, ...updates } : p) }))
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          const updated = get().plans.find(p => p.id === id)
          if (updated) syncWeeklyPlan(updated, user.id).catch(console.error)
        })
      },

      deletePlan: (id) => {
        set(s => ({ plans: s.plans.filter(p => p.id !== id) }))
        deleteWeeklyPlan(id).catch(console.error)
      },

      setActivePlan: (id) => {
        set(s => ({ plans: s.plans.map(p => ({ ...p, isActive: p.id === id })) }))
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          get().plans.forEach(p => {
            syncWeeklyPlan(p, user.id).catch(console.error)
          })
        })
      },

      loadFromSupabase: async (userId) => {
        const plans = await loadUserWeeklyPlans(userId)
        if (plans.length > 0) set({ plans })
      },

      getActivePlan: () => get().plans.find(p => p.isActive) ?? null,

      getTodayRoutineId: () => {
        const active = get().plans.find(p => p.isActive)
        if (!active) return null
        return active.assignments[getTodayKey()] ?? null
      },
    }),
    { name: 'forge-weekly-plans', version: 1 },
  ),
)
