import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Sparkles, Zap, Flame, Dumbbell, Wind, TreePine,
  Home, Bike, Activity, Layers, Moon, Brain, Timer,
  ChevronRight, TrendingUp, Plus, Clock,
} from 'lucide-react'
import { ExerciseAnimation } from './ExerciseAnimation'
import { useWorkoutStore } from '../store/workoutStore'
import { useWeeklyPlanStore, WEEK_DAYS, WEEK_DAY_LABELS } from '../store/weeklyPlanStore'
import { useUserStore } from '../store/userStore'
import { EXERCISES } from '../data/exercises'
import {
  generateSmartContent,
  type TrainingType, type TrainingGoal, type SmartWorkoutContent, type AIExerciseCard,
} from '../services/grokWorkoutService'
import type { Routine } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SmartWorkoutHubProps {
  onStartRoutine: (routineId: string) => void
  onStartFree: () => void
  onOpenAI: () => void
}

// ─── Training type config ─────────────────────────────────────────────────────
const TRAINING_TYPES: { id: TrainingType; label: string; icon: React.FC<{ size: number; color?: string }>; desc: string; grad: string; border: string }[] = [
  { id: 'gym',      label: 'Gym',         icon: Dumbbell, desc: 'Pesas y máquinas',      grad: 'linear-gradient(135deg,rgba(255,107,26,0.25),rgba(255,107,26,0.08))', border: 'rgba(255,107,26,0.5)'  },
  { id: 'home',     label: 'En casa',     icon: Home,     desc: 'Mancuernas + cuerpo',   grad: 'linear-gradient(135deg,rgba(96,165,250,0.25),rgba(96,165,250,0.08))',  border: 'rgba(96,165,250,0.5)'  },
  { id: 'noequip',  label: 'Sin equipo',  icon: Wind,     desc: 'Solo tu cuerpo',        grad: 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.08))',  border: 'rgba(251,191,36,0.5)'  },
  { id: 'outdoor',  label: 'Exterior',    icon: TreePine, desc: 'Parque y aire libre',   grad: 'linear-gradient(135deg,rgba(74,222,128,0.25),rgba(74,222,128,0.08))',  border: 'rgba(74,222,128,0.5)'  },
]

const TYPE_COLORS: Record<TrainingType, string> = {
  gym: '#FF6B1A', home: '#60A5FA', noequip: '#FBBF24', outdoor: '#4ADE80',
}

// ─── Goal config ──────────────────────────────────────────────────────────────
const GOALS: { id: TrainingGoal; label: string; icon: React.FC<{ size: number }>; color: string }[] = [
  { id: 'burn',       label: 'Quemar grasa',    icon: Flame,     color: '#F87171' },
  { id: 'muscle',     label: 'Aumentar músculo', icon: Dumbbell,  color: '#FF6B1A' },
  { id: 'endurance',  label: 'Resistencia',      icon: Zap,       color: '#4ADE80' },
  { id: 'mobility',   label: 'Movilidad',        icon: Activity,  color: '#60A5FA' },
  { id: 'cardio',     label: 'Cardio',           icon: Bike,      color: '#FB923C' },
  { id: 'legs',       label: 'Piernas',          icon: Layers,    color: '#C084FC' },
  { id: 'recovery',   label: 'Recuperación',     icon: Moon,      color: '#34D399' },
  { id: 'ai',         label: 'IA Personal',      icon: Brain,     color: '#A78BFA' },
]

// ─── Intensity color ──────────────────────────────────────────────────────────
const INTENSITY_COLOR: Record<string, string> = {
  Baja: '#4ADE80', Media: '#FBBF24', Alta: '#FB923C', Extrema: '#F87171',
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-3xl overflow-hidden relative"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 180 }}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl skeleton-shine" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 rounded-full skeleton-shine w-3/4" />
            <div className="h-3 rounded-full skeleton-shine w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full skeleton-shine" />
          <div className="h-5 w-20 rounded-full skeleton-shine" />
        </div>
        <div className="h-3 rounded-full skeleton-shine w-full" />
        <div className="h-3 rounded-full skeleton-shine w-4/5" />
        <div className="mt-1 h-10 rounded-2xl skeleton-shine" />
      </div>
    </div>
  )
}

// ─── Exercise card ────────────────────────────────────────────────────────────
function ExerciseCard({
  card, accentColor, index, onAdd,
}: { card: AIExerciseCard; accentColor: string; index: number; onAdd: (exerciseId: string) => void }) {
  const exercise = EXERCISES.find(e => e.id === card.exerciseId)
  const intensityColor = INTENSITY_COLOR[card.intensity] ?? '#FBBF24'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 380, damping: 28 }}
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))',
        border: `1px solid rgba(255,255,255,0.09)`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top accent line */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg,${accentColor},transparent)` }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Icon + name */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
          >
            <ExerciseAnimation exerciseId={card.exerciseId} muscles={exercise?.muscles ?? []} color={accentColor} size={36} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-sm text-white leading-tight truncate">{exercise?.name ?? card.exerciseId}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {exercise?.muscles.slice(0, 2).join(' · ')}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {card.badges.slice(0, 2).map(b => (
            <span
              key={b}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {b}
            </span>
          ))}
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${intensityColor}15`, color: intensityColor, border: `1px solid ${intensityColor}30` }}
          >
            {card.intensity}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Timer size={11} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <span className="text-xs font-mono font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{card.setsReps}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame size={11} style={{ color: '#F87171' }} />
            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.calories} kcal</span>
          </div>
        </div>

        {/* Difficulty dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ background: i < (exercise?.difficulty ?? 3) ? accentColor : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        {/* Tip */}
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
          💡 {card.tip}
        </p>

        {/* Add button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onAdd(card.exerciseId)}
          className="mt-auto w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold"
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            color: accentColor,
          }}
        >
          <Plus size={12} />
          Añadir al entreno
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Hero routine card ────────────────────────────────────────────────────────
function HeroRoutineCard({
  content, onStart,
}: { content: SmartWorkoutContent; onStart: () => void }) {
  const { accentColor, secondaryColor, routine, estimatedMinutes, totalCalories } = content
  const muscles = [...new Set(routine.exercises.flatMap(e => {
    const ex = EXERCISES.find(x => x.id === e.exerciseId)
    return ex?.muscles ?? []
  }))].slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="mx-4 mb-5 rounded-3xl overflow-hidden relative"
      style={{
        background: `linear-gradient(145deg, rgba(20,20,28,0.98), rgba(13,13,18,0.95))`,
        border: `1.5px solid ${accentColor}45`,
        boxShadow: `0 8px 40px ${accentColor}20, 0 2px 12px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)` }}
      />

      {/* Color bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor}, transparent)` }} />

      <div className="p-5">
        {/* AI badge + title */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}35` }}
              >
                <Sparkles size={9} />
                IA GENERADO
              </div>
            </div>
            <h3 className="font-display text-xl text-white leading-tight">{routine.name.toUpperCase()}</h3>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{routine.description}</p>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
          >
            <Dumbbell size={26} style={{ color: accentColor }} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Clock size={12} />
            <span className="font-semibold">{estimatedMinutes} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Flame size={12} style={{ color: '#F87171' }} />
            <span className="font-semibold">~{totalCalories} kcal</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Layers size={12} />
            <span className="font-semibold">{routine.exercises.length} ejercicios</span>
          </div>
        </div>

        {/* Muscle tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {muscles.map(m => (
            <span
              key={m}
              className="text-xs px-2.5 py-1 rounded-full capitalize"
              style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {m}
            </span>
          ))}
        </div>

        {/* Start button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
            boxShadow: `0 6px 24px ${accentColor}45`,
          }}
        >
          <Play size={16} fill="white" />
          EMPEZAR AHORA
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Today's plan card ─────────────────────────────────────────────────────────
const DAYS_JS_TO_KEY: Record<number, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
}

function TodayPlanCard({ routine, onStart }: { routine: Routine | null; onStart: () => void }) {
  if (!routine) return null
  const estMins = Math.max(25, routine.exercises.length * 9)

  return (
    <div className="mx-4 mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Entrenamiento de hoy
      </p>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="rounded-2xl overflow-hidden relative cursor-pointer"
        style={{ background: 'rgba(255,107,26,0.08)', border: '1.5px solid rgba(255,107,26,0.3)', boxShadow: '0 4px 20px rgba(255,107,26,0.12)' }}
      >
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,26,0.2)' }}>
            <Flame size={18} style={{ color: '#FF6B1A' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{routine.name}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {routine.exercises.length} ejercicios · ~{estMins} min
            </p>
          </div>
          <div
            className="px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#FF6B1A,#FFA052)', boxShadow: '0 2px 12px rgba(255,107,26,0.4)' }}
          >
            <Play size={12} fill="white" />
            <span className="text-white">Inicio</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Weekly mini-view ─────────────────────────────────────────────────────────
function WeeklyMiniBar({ assignments }: { assignments: Partial<Record<string, string>> }) {
  const todayKey = DAYS_JS_TO_KEY[new Date().getDay()]
  return (
    <div className="flex gap-1.5 justify-center">
      {WEEK_DAYS.map(day => {
        const has = !!assignments[day]
        const isToday = day === todayKey
        return (
          <div
            key={day}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: has ? (isToday ? '#FF6B1A' : 'rgba(255,107,26,0.22)') : 'rgba(255,255,255,0.05)',
              color: has ? (isToday ? '#fff' : '#FF6B1A') : 'rgba(255,255,255,0.2)',
              border: isToday ? '2px solid #FF6B1A' : '1px solid transparent',
            }}
          >
            {WEEK_DAY_LABELS[day as keyof typeof WEEK_DAY_LABELS]}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
// Map user profile → SmartWorkoutHub defaults
function profileToType(equipment: string | undefined): TrainingType {
  if (equipment === 'home_weights') return 'home'
  if (equipment === 'bodyweight') return 'noequip'
  if (equipment === 'outdoor') return 'outdoor'
  return 'gym'
}
function profileToGoal(goal: string | undefined): TrainingGoal {
  if (goal === 'fat_loss') return 'burn'
  if (goal === 'health') return 'cardio'
  if (goal === 'sport') return 'endurance'
  if (goal === 'strength') return 'muscle'
  return 'muscle'
}

export const SmartWorkoutHub: React.FC<SmartWorkoutHubProps> = ({ onStartRoutine, onStartFree, onOpenAI }) => {
  const { routines, addRoutine } = useWorkoutStore()
  const { plans, getTodayRoutineId } = useWeeklyPlanStore()
  const { user } = useUserStore()

  const [trainingType, setTrainingType] = useState<TrainingType>(() => profileToType(user?.equipment))
  const [goal, setGoal] = useState<TrainingGoal>(() => profileToGoal(user?.goal))
  const [content, setContent] = useState<SmartWorkoutContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAllExercises, setShowAllExercises] = useState(false)

  const loadingRef = useRef(false)

  const todayRoutineId = getTodayRoutineId()
  const todayRoutine = todayRoutineId ? routines.find(r => r.id === todayRoutineId) ?? null : null
  const activePlan = plans.find(p => p.isActive)

  const loadContent = useCallback(async (type: TrainingType, g: TrainingGoal) => {
    if (g === 'ai') { onOpenAI(); return }
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setContent(null)
    setShowAllExercises(false)
    const result = await generateSmartContent(type, g)
    setContent(result)
    setLoading(false)
    loadingRef.current = false
  }, [onOpenAI])

  useEffect(() => { loadContent(trainingType, goal) }, [trainingType, goal])

  const handleStartGeneratedRoutine = () => {
    if (!content) return
    const existing = routines.find(r => r.id === content.routine.id)
    if (!existing) addRoutine(content.routine)
    onStartRoutine(content.routine.id)
  }

  const handleAddExercise = (exerciseId: string) => {
    const ex = EXERCISES.find(e => e.id === exerciseId)
    if (!ex) return
    const miniRoutine: Routine = {
      id: `quick_${exerciseId}_${Date.now()}`,
      name: `Quick: ${ex.name}`,
      description: 'Ejercicio rápido',
      exercises: [{ exerciseId, sets: 3, reps: '10-12', rest: 60 }],
      frequency: 'libre',
      category: 'custom',
      difficulty: ex.difficulty as 1 | 2 | 3 | 4 | 5,
      isAIGenerated: false,
    }
    addRoutine(miniRoutine)
    onStartRoutine(miniRoutine.id)
  }

  const visibleExercises = content ? (showAllExercises ? content.exercises : content.exercises.slice(0, 6)) : []

  return (
    <div className="flex flex-col pb-32" style={{ background: '#0A0A0F', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-4xl text-white tracking-tight">Entrenar</h1>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold"
            style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.3)' }}
          >
            <Brain size={13} />
            IA Personal
          </motion.button>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Inteligente · Personalizado · Para ti</p>
      </div>

      {/* ── Today's plan ── */}
      <TodayPlanCard
        routine={todayRoutine}
        onStart={() => todayRoutineId && onStartRoutine(todayRoutineId)}
      />

      {/* ── Training type selector ── */}
      <div className="px-4 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Tipo de entrenamiento
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TRAINING_TYPES.map(t => {
            const isActive = trainingType === t.id
            const color = TYPE_COLORS[t.id]
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTrainingType(t.id)}
                className="rounded-2xl p-3 flex flex-col items-center gap-2 relative overflow-hidden"
                style={{
                  background: isActive ? t.grad : 'rgba(255,255,255,0.04)',
                  border: isActive ? `1.5px solid ${t.border}` : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isActive ? `0 0 20px ${color}25` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="typeGlow"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${color}18, transparent 70%)` }}
                  />
                )}
                <t.icon size={20} color={isActive ? color : 'rgba(255,255,255,0.4)'} />
                <span className="text-[10px] font-bold leading-none text-center" style={{ color: isActive ? color : 'rgba(255,255,255,0.4)' }}>
                  {t.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Goal selector ── */}
      <div className="px-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Tu objetivo
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {GOALS.map(g => {
            const isActive = goal === g.id
            return (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setGoal(g.id)}
                className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all"
                style={{
                  background: isActive ? `${g.color}18` : 'rgba(255,255,255,0.05)',
                  border: isActive ? `1.5px solid ${g.color}55` : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? g.color : 'rgba(255,255,255,0.45)',
                  boxShadow: isActive ? `0 0 16px ${g.color}20` : 'none',
                }}
                animate={{ scale: isActive ? 1.03 : 1 }}
              >
                <g.icon size={13} />
                {g.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Combination context badge ── */}
      {goal !== 'ai' && (() => {
        const typeLabel = TRAINING_TYPES.find(t => t.id === trainingType)?.label ?? trainingType
        const goalLabel = GOALS.find(g => g.id === goal)?.label ?? goal
        const typeColor = TYPE_COLORS[trainingType]
        const goalColor = GOALS.find(g => g.id === goal)?.color ?? '#FF6B1A'
        return (
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30` }}
              >
                {typeLabel}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>+</span>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${goalColor}18`, color: goalColor, border: `1px solid ${goalColor}30` }}
              >
                {goalLabel}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>→</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Plan personalizado
              </span>
            </div>
          </div>
        )
      })()}

      {/* ── Dynamic content ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 flex flex-col gap-4"
          >
            {/* Hero skeleton */}
            <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', height: 220 }}>
              <div className="h-1 skeleton-shine" />
              <div className="p-5 flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-2xl skeleton-shine flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2 pt-1">
                    <div className="h-4 rounded-full skeleton-shine w-1/3" />
                    <div className="h-6 rounded-xl skeleton-shine w-3/4" />
                    <div className="h-3 rounded-full skeleton-shine w-2/3" />
                  </div>
                </div>
                <div className="h-12 rounded-2xl skeleton-shine" />
              </div>
            </div>
            {/* Exercise skeletons */}
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </motion.div>
        ) : content ? (
          <motion.div
            key={`${trainingType}_${goal}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            {/* AI Banner */}
            <div className="mx-4 mb-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: `linear-gradient(135deg, ${content.accentColor}12, ${content.secondaryColor}08)`,
                  border: `1px solid ${content.accentColor}25`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${content.accentColor}20` }}
                >
                  <Sparkles size={15} style={{ color: content.accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white leading-tight">{content.headline}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{content.subtitle}</p>
                </div>
              </motion.div>
            </div>

            {/* Hero routine card */}
            <HeroRoutineCard content={content} onStart={handleStartGeneratedRoutine} />

            {/* Tips */}
            <div className="mx-4 mb-5 flex flex-col gap-2">
              {content.tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-2.5"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: content.accentColor }}
                  />
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{tip}</p>
                </motion.div>
              ))}
            </div>

            {/* Exercises grid */}
            <div className="px-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Ejercicios recomendados
                </p>
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: `${content.accentColor}18`, color: content.accentColor }}
                >
                  {content.exercises.length} ejercicios
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {visibleExercises.map((card, i) => (
                  <ExerciseCard
                    key={card.exerciseId + i}
                    card={card}
                    accentColor={content.accentColor}
                    index={i}
                    onAdd={handleAddExercise}
                  />
                ))}
              </div>

              {content.exercises.length > 6 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAllExercises(v => !v)}
                  className="w-full mt-3 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                >
                  {showAllExercises ? 'Ver menos' : `Ver ${content.exercises.length - 6} más`}
                  <ChevronRight size={12} style={{ transform: showAllExercises ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </motion.button>
              )}
            </div>

            {/* IA Personalizar */}
            <div className="px-4 mb-6">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onOpenAI}
                className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))',
                  border: '1.5px solid rgba(167,139,250,0.35)',
                  boxShadow: '0 4px 24px rgba(167,139,250,0.12)',
                }}
              >
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.1), transparent 60%)' }} />
                <Brain size={18} style={{ color: '#A78BFA', flexShrink: 0 }} />
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Generar con IA Personalizada</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Basado en tu nivel, historial y objetivos
                  </p>
                </div>
                <Sparkles size={14} style={{ color: '#A78BFA', marginLeft: 'auto' }} />
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Weekly plan preview ── */}
      {activePlan && (
        <div className="mx-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Plan activo · {activePlan.name}
            </p>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {Object.keys(activePlan.assignments).length} días/semana
            </span>
          </div>
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <WeeklyMiniBar assignments={activePlan.assignments} />
          </div>
        </div>
      )}

      {/* ── My routines ── */}
      {routines.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Mis rutinas
            </p>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {routines.length} guardadas
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {routines.slice(0, 4).map(routine => {
              const estMins = Math.max(20, routine.exercises.length * 8)
              return (
                <motion.div
                  key={routine.id}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.2)' }}
                    >
                      <Dumbbell size={16} style={{ color: '#FF6B1A' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{routine.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {routine.exercises.length} ejerc · ~{estMins}min
                        </span>
                        {routine.isAIGenerated && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A' }}>
                            IA
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onStartRoutine(routine.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,107,26,0.15)', border: '1px solid rgba(255,107,26,0.25)' }}
                    >
                      <Play size={14} fill="#FF6B1A" style={{ color: '#FF6B1A' }} />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Free workout button ── */}
      <div className="px-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStartFree}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{ border: '1.5px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
        >
          <TrendingUp size={16} />
          <span className="text-sm font-medium">Entreno libre</span>
        </motion.button>
      </div>
    </div>
  )
}

export default SmartWorkoutHub
