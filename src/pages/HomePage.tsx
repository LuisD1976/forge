import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Flame, Play, ChevronRight, Zap, TrendingUp, Dumbbell, Clock,
  Search, X, Sparkles, Crown,
  Timer, Wind, Layers, Home, TreePine, Activity, Bike, Moon, Brain,
  Plus,
} from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useRanksStore } from '../store/ranksStore'
import { RANK_DATA } from '../data/ranks'
import { EXERCISES } from '../data/exercises'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { WorkoutHeatmap } from '../components/WorkoutHeatmap'
import { ExerciseProgressChart } from '../components/ExerciseProgressChart'
import { ExerciseAnimation } from '../components/ExerciseAnimation'
import {
  generateSmartContent, getExerciseMeta,
  type TrainingType, type TrainingGoal, type SmartWorkoutContent, type AIExerciseCard,
} from '../services/grokWorkoutService'

// ─────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────
interface HomePageProps {
  onStartWorkout: (routineId: string) => void
  onNavigate: (tab: string) => void
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Buenas noches'
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const stagger: { container: Variants; item: Variants } = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.02 } } },
  item: { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] } } },
}

const CAT_COLORS: Record<string, string> = {
  push: '#FF6B1A', pull: '#60A5FA', legs: '#C084FC',
  fullbody: '#4ADE80', hiit: '#F87171', custom: '#FFA052',
}

const CHALLENGES = [
  {
    id: '1', title: 'DESAFÍO\n28 DÍAS', subtitle: 'Cuerpo Completo', desc: 'Tonifica y trabaja todos los grupos musculares', days: 28,
    gradient: 'linear-gradient(135deg, #FF6B1A 0%, #FF3D00 100%)',
    glow: 'rgba(255,107,26,0.5)', emoji: '🔥',
    routineId: 'challenge_28_fullbody',
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: '12', rest: 60 },
      { exerciseId: 'push_up', sets: 4, reps: '15', rest: 45 },
      { exerciseId: 'barbell_row', sets: 3, reps: '12', rest: 60 },
      { exerciseId: 'lunge', sets: 3, reps: '10', rest: 45 },
      { exerciseId: 'plank', sets: 3, reps: '45s', rest: 30 },
    ],
  },
  {
    id: '2', title: 'RETO\n21 DÍAS', subtitle: 'Pérdida de Grasa', desc: 'Quema grasa y define tu cuerpo en 3 semanas', days: 21,
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    glow: 'rgba(99,102,241,0.5)', emoji: '⚡',
    routineId: 'challenge_21_fatburn',
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: '15', rest: 45 },
      { exerciseId: 'push_up', sets: 4, reps: '20', rest: 30 },
      { exerciseId: 'lunge', sets: 4, reps: '12', rest: 40 },
      { exerciseId: 'crunch', sets: 3, reps: '20', rest: 30 },
      { exerciseId: 'plank', sets: 3, reps: '30s', rest: 20 },
    ],
  },
  {
    id: '3', title: 'PROGRAMA\n30 DÍAS', subtitle: 'Ganar Músculo', desc: 'Hipertrofia y fuerza para tu máximo potencial', days: 30,
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    glow: 'rgba(5,150,105,0.5)', emoji: '💪',
    routineId: 'challenge_30_muscle',
    exercises: [
      { exerciseId: 'bench_press', sets: 4, reps: '8', rest: 90 },
      { exerciseId: 'squat', sets: 4, reps: '8', rest: 90 },
      { exerciseId: 'deadlift', sets: 3, reps: '6', rest: 120 },
      { exerciseId: 'overhead_press', sets: 3, reps: '8', rest: 75 },
      { exerciseId: 'barbell_row', sets: 3, reps: '8', rest: 75 },
    ],
  },
  {
    id: '4', title: 'RETO\n14 DÍAS', subtitle: 'Core de Acero', desc: 'Abdomen marcado y core fuerte en 2 semanas', days: 14,
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)',
    glow: 'rgba(14,165,233,0.5)', emoji: '🎯',
    routineId: 'challenge_14_core',
    exercises: [
      { exerciseId: 'plank', sets: 4, reps: '60s', rest: 30 },
      { exerciseId: 'crunch', sets: 4, reps: '25', rest: 30 },
      { exerciseId: 'push_up', sets: 3, reps: '15', rest: 45 },
      { exerciseId: 'lunge', sets: 3, reps: '12', rest: 40 },
      { exerciseId: 'squat', sets: 3, reps: '15', rest: 45 },
    ],
  },
]

const MUSCLE_TABS = [
  { id: 'pecho',  label: 'Pecho',    icon: '🫁', cats: ['push'],     keywords: ['bench','pec','chest','pecho','empuje'] },
  { id: 'espalda',label: 'Espalda',  icon: '🦾', cats: ['pull'],     keywords: ['row','pull','lat','espalda','dorsal'] },
  { id: 'piernas',label: 'Piernas',  icon: '🦵', cats: ['legs'],     keywords: ['squat','leg','pierna','quad','hamstring','sentadilla'] },
  { id: 'brazos', label: 'Brazos',   icon: '💪', cats: ['push','pull'], keywords: ['curl','bicep','tricep','press','brazo'] },
  { id: 'core',   label: 'Core',     icon: '⚡', cats: ['fullbody'], keywords: ['ab','core','plank','crunch','abdomen'] },
  { id: 'full',   label: 'Full Body',icon: '🏋️', cats: ['fullbody','hiit'], keywords: ['full','body','hiit','cardio'] },
]

const QUICK_FILTERS = [
  { id: 'short',    label: '< 20 min',    icon: Timer },
  { id: 'stretch',  label: 'Estiramiento', icon: Layers },
  { id: 'warmup',   label: 'Calentamiento',icon: Wind },
  { id: 'gear',     label: 'Con equipo',   icon: Dumbbell },
  { id: 'advanced', label: 'Avanzado',     icon: Zap },
  { id: 'long',     label: '> 30 min',     icon: Clock },
]

const GOAL_TABS = [
  { id: 'muscle',   label: 'Ganar músculo', cats: ['push','pull','legs'] },
  { id: 'fat',      label: 'Quemar grasa',  cats: ['hiit','fullbody'] },
  { id: 'maintain', label: 'Mantenerme',    cats: ['fullbody','custom'] },
  { id: 'strength', label: 'Fuerza',        cats: ['push','pull','legs'] },
]

const WARMUP_ITEMS = [
  {
    title: 'Movilidad articular', duration: '7 min', level: 'Principiante', emoji: '🔄', color: '#60A5FA',
    routineId: 'warmup_mobility',
    exercises: [
      { exerciseId: 'lunge', sets: 2, reps: '10', rest: 20 },
      { exerciseId: 'plank', sets: 2, reps: '20s', rest: 20 },
      { exerciseId: 'push_up', sets: 2, reps: '8', rest: 20 },
    ],
  },
  {
    title: 'Calentamiento dinámico', duration: '10 min', level: 'Todos', emoji: '🔥', color: '#FF6B1A',
    routineId: 'warmup_dynamic',
    exercises: [
      { exerciseId: 'squat', sets: 2, reps: '15', rest: 20 },
      { exerciseId: 'push_up', sets: 2, reps: '12', rest: 20 },
      { exerciseId: 'lunge', sets: 2, reps: '10', rest: 20 },
    ],
  },
  {
    title: 'Estiramientos completos', duration: '15 min', level: 'Todos', emoji: '🧘', color: '#4ADE80',
    routineId: 'warmup_stretch',
    exercises: [
      { exerciseId: 'plank', sets: 3, reps: '30s', rest: 15 },
      { exerciseId: 'lunge', sets: 2, reps: '10', rest: 20 },
      { exerciseId: 'crunch', sets: 2, reps: '15', rest: 15 },
    ],
  },
  {
    title: 'Activación de core', duration: '8 min', level: 'Intermedio', emoji: '⚡', color: '#C084FC',
    routineId: 'warmup_core',
    exercises: [
      { exerciseId: 'plank', sets: 3, reps: '40s', rest: 20 },
      { exerciseId: 'crunch', sets: 3, reps: '20', rest: 20 },
      { exerciseId: 'push_up', sets: 2, reps: '12', rest: 20 },
    ],
  },
]

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function useAnimatedCounter(target: number, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const timeout = setTimeout(() => {
      const start = performance.now()
      let raf: number
      const animate = (now: number) => {
        const progress = Math.min((now - start) / 1000, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(target * eased))
        if (progress < 1) raf = requestAnimationFrame(animate)
      }
      raf = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return value
}

// Search bar
function SearchBar({ query, onChange, onClear }: { query: string; onChange: (v: string) => void; onClear: () => void }) {
  const [focused, setFocused] = useState(false)
  const placeholders = ['Busca entrenamientos...', 'Busca por músculo...', 'Busca por duración...', 'Busca rutinas IA...']
  const [phIdx, setPhIdx] = useState(0)
  useEffect(() => {
    if (focused || query) return
    const t = setInterval(() => setPhIdx(i => (i + 1) % placeholders.length), 2800)
    return () => clearInterval(t)
  }, [focused, query])

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
      style={{
        background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: focused ? '1.5px solid rgba(255,107,26,0.6)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: focused ? '0 0 0 3px rgba(255,107,26,0.1)' : 'none',
      }}
    >
      <Search size={16} style={{ color: focused ? '#FF6B1A' : 'rgba(255,255,255,0.3)', flexShrink: 0, transition: 'color 0.2s' }} />
      <input
        value={query}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholders[phIdx]}
        className="flex-1 bg-transparent text-sm outline-none text-forge-white"
        style={{ caretColor: '#FF6B1A' }}
      />
      <AnimatePresence>
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={onClear}
          >
            <X size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// Challenge carousel card
function ChallengeCard({ c, delay, onStart }: { c: typeof CHALLENGES[0]; delay: number; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileTap={{ scale: 0.96 }}
      onClick={onStart}
      className="flex-shrink-0 snap-start rounded-3xl overflow-hidden relative cursor-pointer"
      style={{ width: 260, height: 160, background: c.gradient, boxShadow: `0 8px 32px ${c.glow}` }}
    >
      {/* Depth overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, transparent 60%)' }} />
      {/* Emoji */}
      <div className="absolute top-4 right-4 text-4xl opacity-80">{c.emoji}</div>
      {/* Shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />

      <div className="relative p-5 flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{c.days} días · {c.subtitle}</span>
          <h3 className="font-display text-2xl text-white leading-tight mt-1" style={{ whiteSpace: 'pre-line' }}>{c.title}</h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/60 max-w-[140px] leading-tight">{c.desc}</p>
          <motion.div
            whileTap={{ scale: 0.88 }}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.35)' }}
          >
            <Play size={10} fill="white" />
            INICIO
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// Workout card for muscle tabs
function WorkoutCard({ name, duration, sets, difficulty, color, imageUrl, onStart }: {
  name: string; duration: number; sets: number; difficulty: number; color: string; imageUrl?: string; onStart: () => void
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onStart}
      className="flex-shrink-0 snap-start rounded-2xl overflow-hidden cursor-pointer"
      style={{ width: 160, background: '#13131A', border: `1px solid ${color}20` }}
    >
      <div className="relative h-24 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}25, ${color}08)` }}>
            <Dumbbell size={32} style={{ color: `${color}60` }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(19,19,26,0.9) 0%, transparent 60%)' }} />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${color}30`, color }}>
          {['', 'Básico', 'Interm.', 'Avanzado', 'Elite', 'Máx.'][Math.min(difficulty, 5)]}
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-forge-white text-xs leading-tight truncate mb-1.5">{name}</p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="flex items-center gap-0.5"><Clock size={9} />{duration}min</span>
          <span>·</span>
          <span>{sets} series</span>
        </div>
        <div className="flex gap-0.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full" style={{ background: i < difficulty ? color : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Section header
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-bold text-forge-white text-base">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#FF6B1A' }}>
          Más <ChevronRight size={13} />
        </button>
      )}
    </div>
  )
}

// Tooltip for chart
const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-1.5 rounded-xl text-xs font-mono" style={{ background: '#1A1A23', border: '1px solid #32323F', color: '#FF6B1A' }}>
      {Number(payload[0].value).toLocaleString()} kg
    </div>
  )
}

// ─────────────────────────────────────────────
// Smart Training System
// ─────────────────────────────────────────────
const TRAINING_TYPES_CFG: { id: TrainingType; label: string; icon: React.FC<{ size: number; color?: string }>; grad: string; border: string; color: string }[] = [
  { id: 'gym',     label: 'Gym',        icon: Dumbbell,  grad: 'linear-gradient(135deg,rgba(255,107,26,0.25),rgba(255,107,26,0.06))', border: 'rgba(255,107,26,0.5)',  color: '#FF6B1A' },
  { id: 'home',    label: 'Casa',       icon: Home,      grad: 'linear-gradient(135deg,rgba(96,165,250,0.25),rgba(96,165,250,0.06))',  border: 'rgba(96,165,250,0.5)',  color: '#60A5FA' },
  { id: 'noequip', label: 'Sin equipo', icon: Wind,      grad: 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.06))',  border: 'rgba(251,191,36,0.5)',  color: '#FBBF24' },
  { id: 'outdoor', label: 'Exterior',   icon: TreePine,  grad: 'linear-gradient(135deg,rgba(74,222,128,0.25),rgba(74,222,128,0.06))',  border: 'rgba(74,222,128,0.5)',  color: '#4ADE80' },
]

const GOALS_CFG: { id: TrainingGoal; label: string; icon: React.FC<{ size: number }>; color: string }[] = [
  { id: 'burn',      label: 'Quemar grasa',    icon: Flame,    color: '#F87171' },
  { id: 'muscle',    label: 'Músculo',          icon: Dumbbell, color: '#FF6B1A' },
  { id: 'endurance', label: 'Resistencia',      icon: Zap,      color: '#4ADE80' },
  { id: 'mobility',  label: 'Movilidad',        icon: Activity, color: '#60A5FA' },
  { id: 'cardio',    label: 'Cardio',           icon: Bike,     color: '#FB923C' },
  { id: 'legs',      label: 'Piernas',          icon: Layers,   color: '#C084FC' },
  { id: 'recovery',  label: 'Recuperación',     icon: Moon,     color: '#34D399' },
  { id: 'ai',        label: 'IA Personal',      icon: Brain,    color: '#A78BFA' },
]

const INTENSITY_CLR: Record<string, string> = {
  Baja: '#4ADE80', Media: '#FBBF24', Alta: '#FB923C', Extrema: '#F87171',
}

function SmartExerciseCard({ card, accentColor, index, onAdd }: {
  card: AIExerciseCard; accentColor: string; index: number; onAdd: (id: string) => void
}) {
  const exercise = EXERCISES.find(e => e.id === card.exerciseId)
  const intensityColor = INTENSITY_CLR[card.intensity] ?? '#FBBF24'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 360, damping: 28 }}
      className="rounded-3xl overflow-hidden flex flex-col flex-shrink-0"
      style={{
        width: 160,
        background: 'linear-gradient(160deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="h-0.5" style={{ background: `linear-gradient(90deg,${accentColor},transparent)` }} />
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
            <ExerciseAnimation exerciseId={card.exerciseId} muscles={exercise?.muscles ?? []} color={accentColor} size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[11px] text-white leading-tight truncate">{exercise?.name ?? card.exerciseId}</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {exercise?.muscles.slice(0, 2).join(' · ')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {card.badges.slice(0, 2).map(b => (
            <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}25` }}>
              {b}
            </span>
          ))}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${intensityColor}15`, color: intensityColor, border: `1px solid ${intensityColor}25` }}>
            {card.intensity}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="font-mono font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.setsReps}</span>
          <span style={{ color: '#F87171' }}>🔥 {card.calories}</span>
        </div>

        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full"
              style={{ background: i < (exercise?.difficulty ?? 3) ? accentColor : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onAdd(card.exerciseId)}
          className="w-full py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold"
          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30`, color: accentColor }}
        >
          <Plus size={10} />
          Añadir
        </motion.button>
      </div>
    </motion.div>
  )
}

function SmartSkeletonRow() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="rounded-3xl overflow-hidden flex-shrink-0"
          style={{ width: 160, height: 220, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="h-0.5 skeleton-shine" />
          <div className="p-3 flex flex-col gap-2.5">
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-xl skeleton-shine flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5 pt-1">
                <div className="h-3 rounded-full skeleton-shine w-3/4" />
                <div className="h-2 rounded-full skeleton-shine w-1/2" />
              </div>
            </div>
            <div className="flex gap-1">
              <div className="h-4 w-14 rounded-full skeleton-shine" />
              <div className="h-4 w-12 rounded-full skeleton-shine" />
            </div>
            <div className="h-2 rounded-full skeleton-shine" />
            <div className="h-1 rounded-full skeleton-shine" />
            <div className="h-8 rounded-xl skeleton-shine mt-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main HomePage
// ─────────────────────────────────────────────
export const HomePage: React.FC<HomePageProps> = ({ onStartWorkout, onNavigate }) => {
  const { user } = useUserStore()
  const { routines, sessions, weeklyVolume } = useWorkoutStore()
  const { muscleRanks, totalXP, getOverallTier } = useRanksStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeGoalTab, setActiveGoalTab] = useState('muscle')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Smart training system
  const [trainingType, setTrainingType] = useState<TrainingType>('gym')
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal>('muscle')
  const [smartContent, setSmartContent] = useState<SmartWorkoutContent | null>(null)
  const [smartLoading, setSmartLoading] = useState(false)
  const [showAllSmartEx, setShowAllSmartEx] = useState(false)
  const loadingRef = useRef(false)

  const loadSmartContent = useCallback(async (type: TrainingType, goal: TrainingGoal) => {
    if (goal === 'ai') { onNavigate('add'); return }
    if (loadingRef.current) return
    loadingRef.current = true
    setSmartLoading(true)
    setSmartContent(null)
    setShowAllSmartEx(false)
    const result = await generateSmartContent(type, goal)
    setSmartContent(result)
    setSmartLoading(false)
    loadingRef.current = false
  }, [onNavigate])

  useEffect(() => { loadSmartContent(trainingType, trainingGoal) }, [trainingType, trainingGoal])

  const handleAddSmartExercise = useCallback((exerciseId: string) => {
    const ex = EXERCISES.find(e => e.id === exerciseId)
    if (!ex || !smartContent) return
    const { addRoutine } = useWorkoutStore.getState()
    const miniRoutine = {
      id: `quick_${exerciseId}_${Date.now()}`,
      name: `Quick: ${ex.name}`,
      description: 'Ejercicio rápido',
      exercises: [{ exerciseId, sets: 3, reps: '10-12', rest: 60 }],
      frequency: 'libre',
      category: 'custom' as const,
      difficulty: ex.difficulty as 1 | 2 | 3 | 4 | 5,
      isAIGenerated: false,
    }
    addRoutine(miniRoutine)
    onStartWorkout(miniRoutine.id)
  }, [smartContent, onStartWorkout])

  const handleStartSmartRoutine = useCallback(() => {
    if (!smartContent) return
    const { addRoutine, routines } = useWorkoutStore.getState()
    const existing = routines.find(r => r.id === smartContent.routine.id)
    if (!existing) addRoutine(smartContent.routine)
    onStartWorkout(smartContent.routine.id)
  }, [smartContent, onStartWorkout])

  const handleStartChallenge = useCallback((challenge: typeof CHALLENGES[0]) => {
    const { addRoutine, routines } = useWorkoutStore.getState()
    const existing = routines.find(r => r.id === challenge.routineId)
    if (!existing) {
      addRoutine({
        id: challenge.routineId,
        name: challenge.title.replace('\n', ' '),
        description: challenge.desc,
        exercises: challenge.exercises,
        frequency: 'diario',
        category: 'fullbody' as const,
        difficulty: 3,
        isAIGenerated: false,
      })
    }
    onStartWorkout(challenge.routineId)
  }, [onStartWorkout])

  const handleStartWarmup = useCallback((item: typeof WARMUP_ITEMS[0]) => {
    const { addRoutine, routines } = useWorkoutStore.getState()
    const existing = routines.find(r => r.id === item.routineId)
    if (!existing) {
      addRoutine({
        id: item.routineId,
        name: item.title,
        description: `${item.duration} · Nivel ${item.level}`,
        exercises: item.exercises,
        frequency: 'libre',
        category: 'custom' as const,
        difficulty: 1,
        isAIGenerated: false,
      })
    }
    onStartWorkout(item.routineId)
  }, [onStartWorkout])

  const handleSearchExerciseStart = useCallback((exerciseId: string, exerciseName: string) => {
    const { addRoutine } = useWorkoutStore.getState()
    const quickId = `quick_search_${exerciseId}`
    const { routines: currentRoutines } = useWorkoutStore.getState()
    const existing = currentRoutines.find(r => r.id === quickId)
    if (!existing) {
      const ex = EXERCISES.find(e => e.id === exerciseId)
      addRoutine({
        id: quickId,
        name: exerciseName,
        description: 'Ejercicio rápido desde búsqueda',
        exercises: [{ exerciseId, sets: 3, reps: '10-12', rest: 60 }],
        frequency: 'libre',
        category: 'custom' as const,
        difficulty: (ex?.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5,
        isAIGenerated: false,
      })
    }
    onStartWorkout(quickId)
  }, [onStartWorkout])

  const visibleSmartEx = smartContent
    ? (showAllSmartEx ? smartContent.exercises : smartContent.exercises.slice(0, 4))
    : []

  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const firstName = user?.displayName?.split(' ')[0] ?? 'Atleta'
  const totalVolumeKg = sessions.reduce((t, s) => t + s.totalVolume, 0)
  const maxVolume = Math.max(...weeklyVolume.map(d => d.volume), 1)
  const totalWeekKg = weeklyVolume.reduce((t, d) => t + d.volume, 0)

  const animXP = useAnimatedCounter(totalXP, 200)
  const animSessions = useAnimatedCounter(sessions.length, 300)
  const animVolume = useAnimatedCounter(Math.round(totalVolumeKg / 1000), 400)

  // Filter chips
  const toggleFilter = (id: string) => setActiveFilters(prev =>
    prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
  )

  // For-you: weakest muscles that have data
  const forYouRanks = useMemo(() =>
    [...muscleRanks]
      .filter(r => r.oneRM > 0)
      .sort((a, b) => a.percentile - b.percentile)
      .slice(0, 3),
    [muscleRanks]
  )

  // Goal tab routines (with quick filter support)
  const goalRoutines = useMemo(() => {
    const tab = GOAL_TABS.find(t => t.id === activeGoalTab)
    let filtered = tab ? routines.filter(r => tab.cats.includes(r.category)) : [...routines]

    if (activeFilters.includes('short')) {
      filtered = filtered.filter(r => r.exercises.length * 8 < 20)
    }
    if (activeFilters.includes('long')) {
      filtered = filtered.filter(r => r.exercises.length * 8 >= 30)
    }
    if (activeFilters.includes('advanced')) {
      filtered = filtered.filter(r => (r.difficulty ?? 3) >= 4)
    }
    if (activeFilters.includes('gear')) {
      filtered = filtered.filter(r => r.exercises.some(e => {
        const ex = EXERCISES.find(x => x.id === e.exerciseId)
        return ex?.equipment !== 'bodyweight'
      }))
    }

    return filtered.slice(0, 6)
  }, [activeGoalTab, routines, activeFilters])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return EXERCISES.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.muscles.some(m => m.toLowerCase().includes(q))
    ).slice(0, 6)
  }, [searchQuery])

  const recentSessions = sessions.slice(0, 3)

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 pb-32"
      style={{ background: '#0D0D0F', minHeight: '100vh' }}
    >

      {/* ── 1. HEADER ────────────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4 pt-12">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {greeting()}
            </p>
            <h1
              className="font-display text-5xl leading-none"
              style={{ background: 'linear-gradient(135deg, #F0F0EC 20%, #FF6B1A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {firstName}
            </h1>
            <p className="text-[11px] mt-1.5 capitalize" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* PRO badge */}
            {user?.isPro ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.1))', border: '1px solid rgba(255,215,0,0.4)', color: '#FFD700' }}
              >
                <Crown size={12} />PRO
              </div>
            ) : (
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', color: '#fff', boxShadow: '0 4px 12px rgba(255,107,26,0.4)' }}
              >
                <Crown size={12} />PRO+
              </button>
            )}
            {/* Streak */}
            <motion.div
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
              style={{ background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.25)' }}
              whileTap={{ scale: 0.92 }}
            >
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame size={16} style={{ color: '#FF6B1A', filter: 'drop-shadow(0 0 5px #FF6B1A)' }} />
              </motion.div>
              <span className="font-display text-xl leading-none text-forge-white">{user?.streak ?? 0}</span>
              <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>días</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. SEARCH ────────────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <SearchBar query={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery('')} />

        {/* Search results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-2 rounded-2xl overflow-hidden"
              style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {searchResults.map((ex, i) => (
                <motion.button
                  key={ex.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { handleSearchExerciseStart(ex.id, ex.name); setSearchQuery('') }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-left"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <img src={ex.imageUrl} alt={ex.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forge-white truncate">{ex.name}</p>
                    <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{ex.muscles.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A', border: '1px solid rgba(255,107,26,0.3)' }}>
                    <Play size={9} fill="#FF6B1A" />
                    Iniciar
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── 3. STATS PILL ROW ────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Entrenos', value: animSessions, icon: Dumbbell, color: '#FF6B1A' },
            { label: 'Volumen', value: `${animVolume}t`, icon: TrendingUp, color: '#4ADE80' },
            { label: 'XP Total', value: `${(animXP / 1000).toFixed(1)}k`, icon: Zap, color: '#C084FC' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="rounded-2xl p-3.5 text-center"
              style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
            >
              <s.icon size={14} style={{ color: s.color, margin: '0 auto 4px' }} />
              <div className="font-display text-xl text-forge-white">{s.value}</div>
              <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 3b. FIRST RUN HERO ───────────────────────── */}
      {sessions.length === 0 && (
        <motion.div variants={stagger.item} className="px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,26,0.12) 0%, rgba(255,160,82,0.05) 100%)',
              border: '1.5px solid rgba(255,107,26,0.35)',
              boxShadow: '0 4px 30px rgba(255,107,26,0.12)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,107,26,0.7), transparent)' }} />
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl"
              >
                ⚡
              </motion.div>
              <div>
                <h3 className="font-display text-3xl text-white">¡EMPIEZA HOY!</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Tu primera sesión te espera. Elige un objetivo abajo o deja que la IA cree tu rutina perfecta.
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('add')}
                  className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 18px rgba(255,107,26,0.45)' }}
                >
                  Comenzar ahora
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('coach')}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm"
                  style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.35)' }}
                >
                  Pedir a la IA
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── 4. CHALLENGE CAROUSEL ────────────────────── */}
      <motion.div variants={stagger.item} className="flex flex-col gap-3">
        <div className="px-4">
          <SectionHeader title="Desafíos activos" />
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory pb-1" style={{ scrollbarWidth: 'none' }}>
          {CHALLENGES.map((c, i) => (
            <ChallengeCard key={c.id} c={c} delay={i * 0.07} onStart={() => handleStartChallenge(c)} />
          ))}
        </div>
      </motion.div>

      {/* ── 5. SMART TRAINING SYSTEM ─────────────────── */}
      <motion.div variants={stagger.item} className="flex flex-col gap-4">

        {/* Header */}
        <div className="px-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-forge-white text-base">Tu entrenamiento</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Personalizado con IA</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onNavigate('add')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
            style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.3)' }}
          >
            <Brain size={11} />
            IA Completa
          </motion.button>
        </div>

        {/* Training type selector */}
        <div className="px-4">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Tipo de entreno
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TRAINING_TYPES_CFG.map(t => {
              const isActive = trainingType === t.id
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setTrainingType(t.id)}
                  className="rounded-2xl p-2.5 flex flex-col items-center gap-1.5 relative overflow-hidden"
                  style={{
                    background: isActive ? t.grad : 'rgba(255,255,255,0.04)',
                    border: isActive ? `1.5px solid ${t.border}` : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isActive ? `0 0 18px ${t.color}22` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <t.icon size={18} color={isActive ? t.color : 'rgba(255,255,255,0.4)'} />
                  <span className="text-[9px] font-bold leading-none text-center"
                    style={{ color: isActive ? t.color : 'rgba(255,255,255,0.35)' }}>
                    {t.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Goal selector */}
        <div className="px-4">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Objetivo
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {GOALS_CFG.map(g => {
              const isActive = trainingGoal === g.id
              return (
                <motion.button
                  key={g.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTrainingGoal(g.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold"
                  style={{
                    background: isActive ? `${g.color}18` : 'rgba(255,255,255,0.05)',
                    border: isActive ? `1.5px solid ${g.color}55` : '1px solid rgba(255,255,255,0.07)',
                    color: isActive ? g.color : 'rgba(255,255,255,0.4)',
                    boxShadow: isActive ? `0 0 14px ${g.color}20` : 'none',
                    transition: 'all 0.18s',
                  }}
                  animate={{ scale: isActive ? 1.04 : 1 }}
                >
                  <g.icon size={12} />
                  {g.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Dynamic content */}
        <AnimatePresence mode="wait">
          {smartLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
              <SmartSkeletonRow />
            </motion.div>
          ) : smartContent ? (
            <motion.div
              key={`${trainingType}_${trainingGoal}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {/* AI banner */}
              <div className="mx-4">
                <div
                  className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5"
                  style={{
                    background: `linear-gradient(135deg,${smartContent.accentColor}12,${smartContent.secondaryColor}08)`,
                    border: `1px solid ${smartContent.accentColor}22`,
                  }}
                >
                  <Sparkles size={14} style={{ color: smartContent.accentColor, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-white truncate">{smartContent.headline}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{smartContent.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>⏱ {smartContent.estimatedMinutes}m</span>
                    <span>🔥 ~{smartContent.totalCalories}</span>
                  </div>
                </div>
              </div>

              {/* Exercise cards horizontal scroll */}
              <div className="flex gap-3 px-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {visibleSmartEx.map((card, i) => (
                  <SmartExerciseCard
                    key={card.exerciseId + i}
                    card={card}
                    accentColor={smartContent.accentColor}
                    index={i}
                    onAdd={handleAddSmartExercise}
                  />
                ))}

                {/* Quick start card */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartSmartRoutine}
                  className="flex-shrink-0 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-3 relative cursor-pointer"
                  style={{
                    width: 130, minHeight: 220,
                    background: `linear-gradient(160deg,${smartContent.accentColor}22,${smartContent.accentColor}08)`,
                    border: `1.5px solid ${smartContent.accentColor}40`,
                    boxShadow: `0 4px 20px ${smartContent.accentColor}18`,
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${smartContent.accentColor}25`, border: `1px solid ${smartContent.accentColor}40` }}>
                    <Play size={20} fill={smartContent.accentColor} style={{ color: smartContent.accentColor }} />
                  </div>
                  <div className="text-center px-3">
                    <p className="text-[11px] font-bold leading-tight" style={{ color: smartContent.accentColor }}>
                      Iniciar rutina
                    </p>
                    <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {smartContent.routine.exercises.length} ejercicios
                    </p>
                  </div>
                </motion.button>
              </div>

              {/* Show more / tips */}
              {smartContent.exercises.length > 4 && (
                <div className="px-4">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAllSmartEx(v => !v)}
                    className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    {showAllSmartEx ? 'Ver menos ↑' : `Ver ${smartContent.exercises.length - 4} ejercicios más ↓`}
                  </motion.button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

      </motion.div>

      {/* ── 6. QUICK FILTERS ─────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK_FILTERS.map(f => {
            const isActive = activeFilters.includes(f.id)
            const Icon = f.icon
            return (
              <motion.button
                key={f.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleFilter(f.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
                animate={{
                  background: isActive ? 'rgba(255,107,26,0.2)' : 'rgba(255,255,255,0.05)',
                  boxShadow: isActive ? '0 0 10px rgba(255,107,26,0.3)' : 'none',
                }}
                style={{
                  border: isActive ? '1.5px solid rgba(255,107,26,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#FF6B1A' : 'rgba(255,255,255,0.4)',
                }}
              >
                <Icon size={11} />
                {f.label}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* ── 7. CREA TU ENTRENAMIENTO ─────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('add')}
          className="w-full rounded-3xl overflow-hidden relative"
          style={{ height: 110, background: 'linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a1040 100%)' }}
        >
          {/* Stars background */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                background: 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4) 0%, transparent 60%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />

          <div className="relative flex items-center h-full px-6 gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Layers size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-display text-2xl text-white leading-tight">CREA EL TUYO</p>
              <p className="text-xs text-white/50 mt-0.5">Diseña tu entrenamiento perfecto</p>
            </div>
            <div
              className="px-4 py-2 rounded-xl font-bold text-xs text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              IR →
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* ── 8. PARA TI ───────────────────────────────── */}
      {(forYouRanks.length > 0 || routines.length > 0) && (
        <motion.div variants={stagger.item} className="px-4">
          <SectionHeader title="Solo para ti" onSeeAll={() => onNavigate('ranks')} />
          <div className="flex flex-col gap-2.5">
            {(forYouRanks.length > 0 ? forYouRanks.map(rank => {
              const rankData = RANK_DATA[rank.tier]
              const related = routines.find(r => {
                const muscleMap: Record<string, string[]> = {
                  pecho: ['push'], espalda: ['pull'], cuadriceps: ['legs'],
                  isquiotibiales: ['legs'], gluteos: ['legs'], biceps: ['pull'], triceps: ['push'],
                }
                return (muscleMap[rank.muscle] ?? []).includes(r.category)
              })
              return { rank, related, rankData }
            }) : routines.slice(0, 2).map(r => ({
              rank: null,
              related: r,
              rankData: null,
            }))).slice(0, 3).map((item, i) => {
              const r = item.related
              if (!r) return null
              const color = CAT_COLORS[r.category] ?? '#FF6B1A'
              const ex = EXERCISES.find(x => x.id === r.exercises[0]?.exerciseId)
              return (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStartWorkout(r.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-center gap-4 rounded-2xl overflow-hidden text-left"
                  style={{ background: '#13131A', border: `1px solid rgba(255,255,255,0.06)` }}
                >
                  <div className="w-20 h-16 flex-shrink-0 relative overflow-hidden">
                    {ex?.imageUrl ? (
                      <img src={ex.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}30, ${color}08)` }} />
                    )}
                  </div>
                  <div className="flex-1 py-3 min-w-0">
                    <p className="font-bold text-forge-white text-sm truncate">{r.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {Math.max(20, r.exercises.length * 8)} min · {r.exercises.length} ejercicios
                    </p>
                    {item.rank && (
                      <span className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full font-semibold" style={{ background: `${item.rankData!.color}20`, color: item.rankData!.color }}>
                        Mejora tu {item.rank.muscle}
                      </span>
                    )}
                  </div>
                  <div className="pr-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <Play size={12} fill={color} style={{ color }} />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── 9. ESTIRA Y CALIENTA ─────────────────────── */}
      <motion.div variants={stagger.item} className="flex flex-col gap-3">
        <div className="px-4">
          <SectionHeader title="Estira y Calienta" />
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory pb-1" style={{ scrollbarWidth: 'none' }}>
          {WARMUP_ITEMS.map((w, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleStartWarmup(w)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="flex-shrink-0 snap-start rounded-2xl p-4 text-left"
              style={{
                width: 150, height: 130,
                background: `linear-gradient(135deg, ${w.color}20, ${w.color}08)`,
                border: `1px solid ${w.color}30`,
              }}
            >
              <div className="text-3xl mb-2">{w.emoji}</div>
              <p className="font-bold text-forge-white text-sm leading-tight">{w.title}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Clock size={9} />{w.duration} · {w.level}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── 10. OBJETIVOS POPULARES ──────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <SectionHeader title="Objetivos populares" onSeeAll={() => onNavigate('ranks')} />

        {/* Goal tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {GOAL_TABS.map(g => {
            const isActive = activeGoalTab === g.id
            return (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setActiveGoalTab(g.id)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: isActive ? '#FF6B1A' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isActive ? '0 4px 16px rgba(255,107,26,0.4)' : 'none',
                }}
              >
                {g.label}
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeGoalTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {goalRoutines.length > 0 ? goalRoutines.map(r => {
              const color = CAT_COLORS[r.category] ?? '#FF6B1A'
              const ex = EXERCISES.find(x => x.id === r.exercises[0]?.exerciseId)
              return (
                <motion.button
                  key={r.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStartWorkout(r.id)}
                  className="flex items-center gap-4 p-3 rounded-2xl text-left"
                  style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: `${color}15` }}>
                    {ex?.imageUrl && <img src={ex.imageUrl} alt={r.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-forge-white text-sm truncate">{r.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {Math.max(20, r.exercises.length * 8)}min · {r.exercises.length} ejercicios
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                    <ChevronRight size={14} style={{ color }} />
                  </div>
                </motion.button>
              )
            }) : (
              <div className="py-6 text-center rounded-2xl" style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Genera rutinas con IA para este objetivo</p>
                <button
                  onClick={() => onNavigate('add')}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'rgba(255,107,26,0.2)', border: '1px solid rgba(255,107,26,0.4)' }}
                >
                  <Sparkles size={11} className="inline mr-1" />Generar ahora
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── 11. TU PROGRESO ──────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <SectionHeader title="Tu progreso" />
        <div className="rounded-3xl p-4" style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Rank row */}
          <div
            className="flex items-center gap-3 pb-4 mb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <motion.div
              animate={{ boxShadow: [`0 0 0px ${overallRank.color}00`, `0 0 20px ${overallRank.color}50`, `0 0 6px ${overallRank.color}15`] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 flex-shrink-0"
              style={{ backgroundColor: overallRank.bgColor, borderColor: overallRank.color }}
            >
              {overallRank.icon}
            </motion.div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Rango global</p>
              <p className="font-display text-xl" style={{ color: overallRank.color }}>{overallRank.label.toUpperCase()}</p>
            </div>
            <button onClick={() => onNavigate('ranks')} className="text-[11px] font-semibold" style={{ color: '#FF6B1A' }}>
              Ver rangos →
            </button>
          </div>

          {/* Volume chart */}
          <p className="text-xs font-semibold text-forge-white/50 mb-2">Volumen semanal · {totalWeekKg.toLocaleString()} kg</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolume} margin={{ top: 2, right: 0, left: -28, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFA052" />
                    <stop offset="100%" stopColor="#FF6B1A" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 } as object} />
                <Bar dataKey="volume" radius={[4, 4, 1, 1]}>
                  {weeklyVolume.map((e, i) => (
                    <Cell key={i} fill={e.volume === maxVolume && e.volume > 0 ? 'url(#barGrad)' : e.volume > 0 ? 'rgba(255,107,26,0.3)' : '#1E1E26'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── 12. HEATMAP ──────────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <WorkoutHeatmap />
      </motion.div>

      {/* ── 13. EXERCISE PROGRESS ────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <ExerciseProgressChart />
      </motion.div>

      {/* ── 14. MUSCLE RANKS ─────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <SectionHeader title="Rangos musculares" onSeeAll={() => onNavigate('ranks')} />
        <div className="flex flex-col gap-2">
          {muscleRanks.slice(0, 5).map((rank, i) => {
            const rd = RANK_DATA[rank.tier]
            return (
              <motion.div
                key={rank.muscle}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border flex-shrink-0"
                  style={{ background: rd.bgColor, color: rd.color, borderColor: `${rd.color}25` }}>
                  {rd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-forge-white capitalize">{rank.muscle}</span>
                    <span className="text-xs font-bold" style={{ color: rd.color }}>{rd.label}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${rd.color}60, ${rd.color})`, boxShadow: `0 0 6px ${rd.color}30` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rank.percentile}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono w-8 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {Math.round(rank.percentile)}%
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── 15. RECENT SESSIONS ──────────────────────── */}
      {recentSessions.length > 0 && (
        <motion.div variants={stagger.item} className="px-4">
          <SectionHeader title="Últimos entrenos" />
          <div className="flex flex-col gap-2">
            {recentSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,26,0.1)' }}>
                  <Clock size={14} className="text-forge-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forge-white text-sm truncate">{session.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {new Date(session.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {session.duration}min · {(session.totalVolume / 1000).toFixed(1)}t
                  </p>
                </div>
                <span className="text-sm font-bold font-mono flex-shrink-0" style={{ color: '#FF6B1A' }}>
                  +{session.xpGained} XP
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── 16. EXPLORE BANNER ───────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('add')}
          className="w-full rounded-3xl overflow-hidden relative"
          style={{ height: 90 }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,107,26,0.15) 0%, transparent 50%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

          <div className="relative flex items-center justify-between h-full px-6">
            <div className="text-left">
              <p className="font-display text-xl text-white">Explorar entrenamientos</p>
              <p className="text-xs text-white/40 mt-0.5">Descubre todo lo que tienes disponible</p>
            </div>
            <div
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.4)' }}
            >
              vamos →
            </div>
          </div>
        </motion.button>
      </motion.div>

    </motion.div>
  )
}

export default HomePage
