export type RankTier =
  | 'hierro' | 'bronce' | 'acero' | 'cobre'
  | 'plata' | 'oro' | 'titanio' | 'platino'
  | 'diamante' | 'leyenda'

export interface RankInfo {
  tier: RankTier
  label: string
  color: string
  bgColor: string
  minPercentile: number
  maxPercentile: number
  icon: string
}

export type MuscleGroup =
  | 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps'
  | 'cuadriceps' | 'isquiotibiales' | 'gluteos' | 'gemelos'
  | 'abdominales' | 'antebrazos' | 'trapecio'

export interface Exercise {
  id: string
  name: string
  muscles: MuscleGroup[]
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'band'
  difficulty: 1 | 2 | 3 | 4 | 5
  imageUrl: string
  description: string
  category: 'compound' | 'isolation'
}

export interface SetEntry {
  id: string
  weight: number
  reps: number
  completed: boolean
  rpe?: number
}

export interface WorkoutExercise {
  exerciseId: string
  sets: SetEntry[]
  notes?: string
}

export interface WorkoutSession {
  id: string
  name: string
  date: string
  duration: number
  exercises: WorkoutExercise[]
  totalVolume: number
  xpGained: number
  notes?: string
}

export interface Routine {
  id: string
  name: string
  description: string
  exercises: { exerciseId: string; sets: number; reps: string; rest: number }[]
  frequency: string
  category: 'push' | 'pull' | 'legs' | 'fullbody' | 'hiit' | 'custom'
  difficulty: 1 | 2 | 3 | 4 | 5
  isAIGenerated?: boolean
}

export interface MuscleRank {
  muscle: MuscleGroup
  tier: RankTier
  percentile: number
  oneRM: number
  xp: number
  nextLevelXp: number
}

export interface UserProfile {
  id: string
  username: string
  displayName: string
  avatar: string
  goal: string
  experience: string
  equipment: string
  isPro: boolean
  proExpiresAt?: string
  streak: number
  totalWorkouts: number
  joinDate: string
  weight?: number
  height?: number
  onboardingComplete: boolean
  questionnaire?: QuestionnaireAnswers
}

export interface QuestionnaireAnswers {
  goal: string
  motivation: string
  experience: string
  equipment: string
  hasUsedApp: boolean
  phrase?: string
  discovery?: string
  age?: number
  sex?: 'male' | 'female'
  weight?: number
  trainingDays?: number
  sessionDuration?: 30 | 45 | 60 | 90
  injuries?: string[]
}

export interface SocialPost {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  imageUrl?: string
  workoutSummary?: {
    name: string
    duration: number
    volume: number
    rankUpdates?: { muscle: string; from: RankTier; to: RankTier }[]
  }
  likes: number
  comments: number
  timeAgo: string
  hasLiked: boolean
  createdAt?: string
}

export interface Friend {
  id: string
  username: string
  displayName: string
  avatar: string
  rankTier: RankTier
  streak: number
  isFollowing: boolean
  weeklyVolume: number
}

export interface BodyMeasurement {
  id: string
  date: string
  weight?: number
  height?: number
  bodyFat?: number
  waist?: number
  chest?: number
  arms?: number
  hips?: number
  thighs?: number
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  oneRM: number
  date: string
}

export type NavTab = 'home' | 'ranks' | 'add' | 'friends' | 'profile'
