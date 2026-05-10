import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Routine, WorkoutSession, WorkoutExercise, SetEntry } from '../types'
import { DEFAULT_ROUTINES } from '../data/routines'

interface ActiveWorkout {
  routineId: string
  name: string
  startTime: string
  exercises: WorkoutExercise[]
  currentExerciseIndex: number
}

interface WorkoutState {
  routines: Routine[]
  sessions: WorkoutSession[]
  activeWorkout: ActiveWorkout | null
  weeklyVolume: { day: string; volume: number }[]

  loadSessions: (sessions: WorkoutSession[]) => void
  loadRoutines: (routines: Routine[]) => void
  addRoutine: (routine: Routine) => void
  removeRoutine: (id: string) => void
  startWorkout: (routine: Routine) => void
  addSet: (exerciseIndex: number, set: Omit<SetEntry, 'id'>) => void
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<SetEntry>) => void
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => void
  finishWorkout: () => WorkoutSession | null
  cancelWorkout: () => void
  getTotalVolume: () => number
  getStreak: () => number
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      routines: DEFAULT_ROUTINES,
      sessions: [],
      activeWorkout: null,
      weeklyVolume: Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return { day: d.toLocaleDateString('es', { weekday: 'short' }), volume: 0 }
      }),

      loadSessions: (sessions) => {
        const volume: Record<string, number> = {}
        const now = new Date()
        sessions.forEach((s) => {
          const d = new Date(s.date)
          const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
          if (diffDays >= 0 && diffDays < 7) {
            const label = d.toLocaleDateString('es', { weekday: 'short' })
            volume[label] = (volume[label] ?? 0) + s.totalVolume
          }
        })
        set((state) => ({
          sessions,
          weeklyVolume: state.weeklyVolume.map((d) => ({ ...d, volume: volume[d.day] ?? 0 })),
        }))
      },

      loadRoutines: (routines) => set({ routines }),

      addRoutine: (routine) =>
        set((state) => ({ routines: [...state.routines, routine] })),

      removeRoutine: (id) =>
        set((state) => ({ routines: state.routines.filter((r) => r.id !== id) })),

      startWorkout: (routine) =>
        set({
          activeWorkout: {
            routineId: routine.id,
            name: routine.name,
            startTime: new Date().toISOString(),
            exercises: routine.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: Array.from({ length: e.sets }, () => ({
                id: crypto.randomUUID(),
                weight: 0,
                reps: 0,
                completed: false,
              })),
            })),
            currentExerciseIndex: 0,
          },
        }),

      addSet: (exerciseIndex, setData) =>
        set((state) => {
          if (!state.activeWorkout) return state
          const exercises = [...state.activeWorkout.exercises]
          exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            sets: [...exercises[exerciseIndex].sets, { ...setData, id: crypto.randomUUID() }],
          }
          return { activeWorkout: { ...state.activeWorkout, exercises } }
        }),

      updateSet: (exerciseIndex, setIndex, updates) =>
        set((state) => {
          if (!state.activeWorkout) return state
          const exercises = [...state.activeWorkout.exercises]
          const sets = [...exercises[exerciseIndex].sets]
          sets[setIndex] = { ...sets[setIndex], ...updates }
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
          return { activeWorkout: { ...state.activeWorkout, exercises } }
        }),

      toggleSetComplete: (exerciseIndex, setIndex) =>
        set((state) => {
          if (!state.activeWorkout) return state
          const exercises = [...state.activeWorkout.exercises]
          const sets = [...exercises[exerciseIndex].sets]
          sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed }
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets }
          return { activeWorkout: { ...state.activeWorkout, exercises } }
        }),

      finishWorkout: () => {
        const { activeWorkout, sessions } = get()
        if (!activeWorkout) return null
        const duration = Math.round((Date.now() - new Date(activeWorkout.startTime).getTime()) / 60000)
        const totalVolume = activeWorkout.exercises.reduce((total, ex) =>
          total + ex.sets.filter((s) => s.completed).reduce((v, s) => v + s.weight * s.reps, 0), 0)
        const session: WorkoutSession = {
          id: crypto.randomUUID(),
          name: activeWorkout.name,
          date: activeWorkout.startTime,
          duration,
          exercises: activeWorkout.exercises,
          totalVolume,
          xpGained: Math.round(totalVolume / 100) + duration * 2,
        }
        const todayLabel = new Date().toLocaleDateString('es', { weekday: 'short' })
        const updatedVolume = get().weeklyVolume.map((d) =>
          d.day === todayLabel ? { ...d, volume: d.volume + totalVolume } : d
        )
        set({ sessions: [session, ...sessions], activeWorkout: null, weeklyVolume: updatedVolume })
        return session
      },

      cancelWorkout: () => set({ activeWorkout: null }),

      getTotalVolume: () => {
        const { sessions } = get()
        return sessions.reduce((t, s) => t + s.totalVolume, 0)
      },

      getStreak: () => {
        const { sessions } = get()
        if (!sessions.length) return 0
        let streak = 0
        const today = new Date().toDateString()
        const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        let checkDate = new Date()
        for (const session of sorted) {
          const sessionDate = new Date(session.date).toDateString()
          if (sessionDate === checkDate.toDateString() || sessionDate === today) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else break
        }
        return streak
      },
    }),
    { name: 'forge-workouts', version: 1 }
  )
)
