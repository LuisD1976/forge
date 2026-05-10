import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store/userStore'
import type { UserProfile, QuestionnaireAnswers } from '../types'

interface DBProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  goal: string
  experience: string
  equipment: string
  is_pro: boolean
  pro_expires_at: string | null
  streak: number
  total_workouts: number
  weight: number | null
  height: number | null
  onboarding_complete: boolean
  questionnaire: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface ProfileUpdates {
  display_name?: string
  avatar_url?: string
  goal?: string
  experience?: string
  equipment?: string
  weight?: number
  height?: number
  onboarding_complete?: boolean
  questionnaire?: QuestionnaireAnswers
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  profileLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: ProfileUpdates) => Promise<{ error: unknown }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function profileToStoreUser(p: DBProfile): UserProfile {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatar: p.avatar_url ?? '',
    goal: p.goal,
    experience: p.experience,
    equipment: p.equipment,
    isPro: p.is_pro,
    proExpiresAt: p.pro_expires_at ?? undefined,
    streak: p.streak,
    totalWorkouts: p.total_workouts,
    joinDate: p.created_at,
    weight: p.weight ?? undefined,
    height: p.height ?? undefined,
    onboardingComplete: p.onboarding_complete,
    questionnaire: p.questionnaire as unknown as QuestionnaireAnswers | undefined,
  }
}

async function loadProfileIntoStore(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return false

  const profile = data as unknown as DBProfile
  useUserStore.setState({
    user: profileToStoreUser(profile),
    isOnboardingComplete: profile.onboarding_complete,
  })
  return true
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          loadProfileIntoStore(session.user.id)
            .catch(console.error)
            .finally(() => { if (mounted) setProfileLoading(false) })
        } else {
          useUserStore.getState().reset()
          setProfileLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (mounted) setProfileLoading(false)
      })
      .finally(() => { if (mounted) setLoading(false) })

    // Escucha cambios posteriores (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        loadProfileIntoStore(session.user.id).catch(console.error)
      }
      if (event === 'SIGNED_OUT') {
        useUserStore.getState().reset()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    // Pasamos display_name en metadata para que el trigger handle_new_user lo use
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: ProfileUpdates) => {
    if (!user) return { error: new Error('No authenticated user') }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', user.id)
    if (!error) await loadProfileIntoStore(user.id)
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, profileLoading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
