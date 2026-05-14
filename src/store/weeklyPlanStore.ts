import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  addPlan: (plan: Omit<WeeklyPlan, 'id' | 'createdAt'>) => void
  updatePlan: (id: string, updates: Partial<WeeklyPlan>) => void
  deletePlan: (id: string) => void
  setActivePlan: (id: string) => void
  getActivePlan: () => WeeklyPlan | null
  getTodayRoutineId: () => string | null
}

function getTodayKey(): WeekDay {
  const days: WeekDay[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return days[new Date().getDay()]
}

export const useWeeklyPlanStore = create<WeeklyPlanState>()(
  persist(
    (set, get) => ({
      plans: [],

      addPlan: (plan) => set(s => ({
        plans: [
          ...s.plans,
          { ...plan, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
        ],
      })),

      updatePlan: (id, updates) => set(s => ({
        plans: s.plans.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

      deletePlan: (id) => set(s => ({ plans: s.plans.filter(p => p.id !== id) })),

      setActivePlan: (id) => set(s => ({
        plans: s.plans.map(p => ({ ...p, isActive: p.id === id })),
      })),

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
