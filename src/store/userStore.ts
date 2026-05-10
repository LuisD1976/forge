import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, QuestionnaireAnswers } from '../types'

interface UserState {
  user: UserProfile | null
  isOnboardingComplete: boolean
  setUser: (user: UserProfile) => void
  updateUser: (updates: Partial<UserProfile>) => void
  completeOnboarding: (answers: QuestionnaireAnswers) => void
  activatePro: () => void
  deactivatePro: () => void
  incrementStreak: () => void
  reset: () => void
}

const defaultUser: UserProfile = {
  id: crypto.randomUUID(),
  username: 'forger',
  displayName: 'Nuevo Forjador',
  avatar: '',
  goal: 'muscle',
  experience: 'beginner',
  equipment: 'gym',
  isPro: false,
  streak: 0,
  totalWorkouts: 0,
  joinDate: new Date().toISOString(),
  onboardingComplete: false,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isOnboardingComplete: false,

      setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      completeOnboarding: (answers) =>
        set((state) => ({
          isOnboardingComplete: true,
          user: {
            ...defaultUser,
            ...state.user,
            id: state.user?.id ?? crypto.randomUUID(),
            questionnaire: answers,
            goal: answers.goal,
            experience: answers.experience,
            equipment: answers.equipment,
            onboardingComplete: true,
          },
        })),

      activatePro: () =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                isPro: true,
                proExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : null,
        })),

      deactivatePro: () =>
        set((state) => ({
          user: state.user ? { ...state.user, isPro: false, proExpiresAt: undefined } : null,
        })),

      incrementStreak: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, streak: state.user.streak + 1, totalWorkouts: state.user.totalWorkouts + 1 }
            : null,
        })),

      reset: () => set({ user: null, isOnboardingComplete: false }),
    }),
    { name: 'forge-user' }
  )
)
