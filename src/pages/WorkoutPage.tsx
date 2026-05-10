import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, ChevronRight, X, Check, Clock, Dumbbell,
  ChevronLeft, Sparkles, Trophy,
} from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { useRanksStore } from '../store/ranksStore'
import { usePRStore } from '../store/prStore'
import { useAchievementsStore } from '../store/achievementsStore'
import { EXERCISES } from '../data/exercises'
import { SetLogger } from '../components/SetLogger'
import { WorkoutTimer } from '../components/WorkoutTimer'
import { RankUpModal } from '../components/RankUpModal'
import { estimateOneRM, calculateXPForSet } from '../utils/rankCalculator'
import { generateRoutineWithAI } from '../utils/claudeAPI'
import { syncWorkoutSession, syncMuscleRanks, syncRoutine } from '../lib/sync'
import { supabase } from '../lib/supabase'
import type { MuscleGroup, RankTier, PersonalRecord } from '../types'
import { RANK_ORDER } from '../data/ranks'

type WorkoutView = 'routines' | 'active' | 'summary' | 'ai'

interface RankUpEvent { muscle: MuscleGroup; from: RankTier; to: RankTier; xp: number }

interface WorkoutPageProps {
  initialRoutineId?: string | null
  onClose?: () => void
}

export const WorkoutPage: React.FC<WorkoutPageProps> = ({ initialRoutineId, onClose }) => {
  const { routines, sessions, activeWorkout, startWorkout, addSet, updateSet, toggleSetComplete, finishWorkout, cancelWorkout, addRoutine, getStreak } = useWorkoutStore()
  const { addXP, updateRank, muscleRanks } = useRanksStore()
  const { checkAndUpdatePR, records: prRecords } = usePRStore()
  const { unlock: unlockAchievements } = useAchievementsStore()

  const [view, setView] = useState<WorkoutView>(activeWorkout ? 'active' : 'routines')
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [completedSession, setCompletedSession] = useState<any>(null)
  const [newPRs, setNewPRs] = useState<PersonalRecord[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restDuration, setRestDuration] = useState(60)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(false)
  const [aiSuccessName, setAiSuccessName] = useState<string | null>(null)
  const [aiParams, setAiParams] = useState({ goal: 'ganar músculo', days: 3, equipment: 'gimnasio', level: 'intermedio' })
  const [rankUpQueue, setRankUpQueue] = useState<RankUpEvent[]>([])
  const [currentRankUp, setCurrentRankUp] = useState<RankUpEvent | null>(null)

  // Auto-start if routineId provided
  useEffect(() => {
    if (initialRoutineId && !activeWorkout) {
      const routine = routines.find((r) => r.id === initialRoutineId)
      if (routine) {
        startWorkout(routine)
        setView('active')
      }
    }
  }, [initialRoutineId])

  // Elapsed timer
  useEffect(() => {
    if (view !== 'active' || !activeWorkout) return
    const startTime = new Date(activeWorkout.startTime).getTime()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [view, activeWorkout])

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleFinish = async () => {
    const session = finishWorkout()
    if (!session) return

    const rankUps: RankUpEvent[] = []
    const prs: PersonalRecord[] = []

    session.exercises.forEach((ex) => {
      const exercise = EXERCISES.find((e) => e.id === ex.exerciseId)
      if (!exercise) return
      const completedSets = ex.sets.filter((s) => s.completed)
      if (!completedSets.length) return
      const bestSet = completedSets.reduce((best, s) => s.weight > best.weight ? s : best)
      const oneRM = estimateOneRM(bestSet.weight, bestSet.reps)

      // PR detection
      if (bestSet.weight > 0 && bestSet.reps > 0) {
        const pr = checkAndUpdatePR(ex.exerciseId, exercise.name, bestSet.weight, bestSet.reps)
        if (pr) prs.push(pr)
      }

      exercise.muscles.forEach((muscle) => {
        const prevRank = muscleRanks.find((r) => r.muscle === muscle)
        const prevTier = prevRank?.tier ?? 'hierro'
        if (oneRM > 0) updateRank(muscle, oneRM)
        const xp = calculateXPForSet(bestSet.weight, bestSet.reps, completedSets.length)
        addXP(muscle, xp)
        const newRank = muscleRanks.find((r) => r.muscle === muscle)
        const newTier = newRank?.tier ?? prevTier
        if (RANK_ORDER.indexOf(newTier) > RANK_ORDER.indexOf(prevTier)) {
          rankUps.push({ muscle, from: prevTier, to: newTier, xp })
        }
      })
    })

    setCompletedSession(session)
    setNewPRs(prs)

    // Check achievements
    const totalVolumeKg = sessions.reduce((t, s) => t + s.totalVolume, 0) / 1000 + session.totalVolume / 1000
    unlockAchievements({
      totalWorkouts: sessions.length + 1,
      streak: getStreak(),
      totalVolumeKg,
      prCount: prRecords.length + prs.length,
    })

    if (rankUps.length > 0) {
      setRankUpQueue(rankUps.slice(1))
      setCurrentRankUp(rankUps[0])
    }

    setView('summary')

    // Sync to Supabase in background
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      syncWorkoutSession(session, user.id).catch(console.error)
      syncMuscleRanks(useRanksStore.getState().muscleRanks, user.id).catch(console.error)
    })
  }

  const handleRankUpClose = () => {
    if (rankUpQueue.length > 0) {
      setCurrentRankUp(rankUpQueue[0])
      setRankUpQueue((q) => q.slice(1))
    } else {
      setCurrentRankUp(null)
    }
  }

  const handleCancel = () => {
    cancelWorkout()
    setView('routines')
    onClose?.()
  }

  const handleGenerateAI = async () => {
    setAiError(false)
    setAiSuccessName(null)
    setAiLoading(true)
    const routine = await generateRoutineWithAI(aiParams)
    setAiLoading(false)
    if (routine) {
      addRoutine(routine)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) syncRoutine(routine, user.id).catch(console.error)
      })
      setAiSuccessName(routine.name)
      setTimeout(() => { setView('routines'); setAiSuccessName(null) }, 2000)
    } else {
      setAiError(true)
    }
  }

  const categoryColors: Record<string, string> = {
    push: '#FF6B1A', pull: '#67E8F9', legs: '#4ADE80',
    fullbody: '#A855F7', hiit: '#EF4444', custom: '#FFA052',
  }

  if (view === 'ai') {
    return (
      <div className="flex flex-col min-h-screen bg-forge-black pb-24">
        <div className="px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setView('routines')} className="text-forge-white/50">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="font-bold text-forge-white text-xl">FORGE IA</h1>
            <p className="text-forge-white/50 text-xs">Tu entrenador personal con inteligencia artificial</p>
          </div>
          <Sparkles size={20} className="text-forge-orange ml-auto" />
        </div>

        <div className="px-4 flex flex-col gap-4">
          <div className="card-metal p-4">
            <label className="text-xs text-forge-white/50 block mb-2">Objetivo</label>
            <input
              value={aiParams.goal}
              onChange={(e) => setAiParams((p) => ({ ...p, goal: e.target.value }))}
              className="w-full bg-forge-border rounded-xl px-3 py-2 text-forge-white text-sm outline-none focus:border-forge-orange border border-transparent"
              placeholder="ej: ganar músculo, perder grasa..."
            />
          </div>

          <div className="card-metal p-4">
            <label className="text-xs text-forge-white/50 block mb-2">Días por semana: {aiParams.days}</label>
            <input
              type="range" min={1} max={7} value={aiParams.days}
              onChange={(e) => setAiParams((p) => ({ ...p, days: +e.target.value }))}
              className="w-full accent-forge-orange"
            />
          </div>

          <div className="card-metal p-4">
            <label className="text-xs text-forge-white/50 block mb-2">Equipamiento</label>
            <div className="grid grid-cols-2 gap-2">
              {['gimnasio', 'casa con pesas', 'sin equipamiento', 'exterior'].map((eq) => (
                <button
                  key={eq}
                  onClick={() => setAiParams((p) => ({ ...p, equipment: eq }))}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    aiParams.equipment === eq
                      ? 'bg-forge-orange text-white'
                      : 'bg-forge-border text-forge-white/70'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="card-metal p-4">
            <label className="text-xs text-forge-white/50 block mb-2">Nivel</label>
            <div className="grid grid-cols-2 gap-2">
              {['principiante', 'intermedio', 'avanzado', 'élite'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAiParams((p) => ({ ...p, level: lvl }))}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    aiParams.level === lvl
                      ? 'bg-forge-orange text-white'
                      : 'bg-forge-border text-forge-white/70'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {aiError && (
            <div className="card-metal p-3 border-red-500/40">
              <p className="text-sm text-red-400 text-center">No se pudo generar la rutina. Intenta de nuevo.</p>
            </div>
          )}

          {aiSuccessName && (
            <div className="card-metal p-3 border-forge-green/40">
              <p className="text-sm text-forge-green text-center font-semibold">¡Rutina "{aiSuccessName}" creada! ✓</p>
            </div>
          )}

          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="btn-forge w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando con IA...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generar rutina con IA
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (view === 'summary' && completedSession) {
    return (
      <div className="flex flex-col min-h-screen bg-forge-black items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-6xl mb-4">
          🔥
        </motion.div>
        <h2 className="text-2xl font-bold text-forge-white mb-2">¡Entreno completado!</h2>
        <p className="text-forge-white/50 mb-6">{completedSession.name}</p>

        <div className="w-full max-w-sm grid grid-cols-3 gap-3 mb-4">
          <div className="card-metal p-3 text-center">
            <div className="text-xl font-bold text-forge-orange">{completedSession.duration}</div>
            <div className="text-xs text-forge-white/40">minutos</div>
          </div>
          <div className="card-metal p-3 text-center">
            <div className="text-xl font-bold text-forge-white">{(completedSession.totalVolume / 1000).toFixed(1)}t</div>
            <div className="text-xs text-forge-white/40">volumen</div>
          </div>
          <div className="card-metal p-3 text-center">
            <div className="text-xl font-bold text-forge-green">+{completedSession.xpGained}</div>
            <div className="text-xs text-forge-white/40">XP ganados</div>
          </div>
        </div>

        {/* Personal Records */}
        {newPRs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-sm card-metal p-4 mb-4"
            style={{ borderColor: '#FFD70040' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} style={{ color: '#FFD700' }} />
              <span className="font-bold text-forge-white text-sm">¡Nuevos récords personales!</span>
            </div>
            <div className="flex flex-col gap-2">
              {newPRs.map((pr) => (
                <div key={pr.exerciseId} className="flex items-center justify-between text-xs">
                  <span className="text-forge-white/70 truncate flex-1">{pr.exerciseName}</span>
                  <span className="font-mono font-bold ml-2" style={{ color: '#FFD700' }}>
                    {pr.weight}kg × {pr.reps} ({pr.oneRM.toFixed(0)} 1RM)
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <button
          onClick={() => { setView('routines'); onClose?.() }}
          className="btn-forge w-full max-w-sm py-4"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  if (view === 'active' && activeWorkout) {
    const currentEx = activeWorkout.exercises[currentExerciseIdx]
    const exercise = EXERCISES.find((e) => e.id === currentEx?.exerciseId)
    const completedSets = activeWorkout.exercises.reduce(
      (t, ex) => t + ex.sets.filter((s) => s.completed).length, 0
    )
    const totalSets = activeWorkout.exercises.reduce((t, ex) => t + ex.sets.length, 0)

    return (
      <div className="flex flex-col min-h-screen bg-forge-black pb-8">
        {/* Header */}
        <div className="bg-forge-iron border-b border-forge-border px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={handleCancel} className="text-forge-white/50 hover:text-forge-red transition-colors">
              <X size={22} />
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-forge-white text-sm">{activeWorkout.name}</h2>
              <div className="flex items-center gap-2 justify-center text-forge-white/50 text-xs">
                <Clock size={12} />
                <span className="font-mono">{formatElapsed(elapsed)}</span>
              </div>
            </div>
            <button onClick={handleFinish} className="text-forge-orange text-sm font-semibold">
              Terminar
            </button>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-forge-white/40 mb-1">
              <span>{completedSets} series completadas</span>
              <span>{totalSets} totales</span>
            </div>
            <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
              <div
                className="h-full bg-forge-orange rounded-full transition-all duration-500"
                style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Exercise tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {activeWorkout.exercises.map((ex, i) => {
            const exData = EXERCISES.find((e) => e.id === ex.exerciseId)
            const done = ex.sets.filter((s) => s.completed).length
            const total = ex.sets.length
            const isActive = i === currentExerciseIdx
            return (
              <button
                key={i}
                onClick={() => setCurrentExerciseIdx(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-forge-orange text-white border-forge-orange'
                    : done === total && total > 0
                    ? 'bg-forge-green/20 border-forge-green/40 text-forge-green'
                    : 'bg-forge-border border-forge-border text-forge-white/60'
                }`}
              >
                {exData?.name.split(' ')[0] ?? ex.exerciseId} {done}/{total}
              </button>
            )
          })}
        </div>

        {/* Current Exercise */}
        {exercise && currentEx && (
          <div className="flex-1 px-4">
            <div className="card-metal p-4 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="w-16 h-16 rounded-xl object-cover bg-forge-border"
                />
                <div>
                  <h3 className="font-bold text-forge-white">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.muscles.map((m) => (
                      <span key={m} className="text-xs bg-forge-border text-forge-white/60 px-2 py-0.5 rounded-full capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <SetLogger
                sets={currentEx.sets}
                exerciseIndex={currentExerciseIdx}
                onUpdateSet={updateSet}
                onToggleComplete={(exIdx, setIdx) => {
                  toggleSetComplete(exIdx, setIdx)
                  const set = currentEx.sets[setIdx]
                  if (!set.completed) {
                    const routine = routines.find((r) => r.id === activeWorkout.routineId)
                    const routineEx = routine?.exercises[exIdx]
                    if (routineEx) setRestDuration(routineEx.rest)
                    setShowRestTimer(true)
                  }
                }}
                onAddSet={(exIdx) => {
                  addSet(exIdx, { weight: 0, reps: 0, completed: false })
                }}
              />
            </div>

            {/* Rest Timer */}
            <AnimatePresence>
              {showRestTimer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="card-metal p-4 mb-4 border-forge-orange/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-forge-white">Descanso</span>
                    <button onClick={() => setShowRestTimer(false)} className="text-forge-white/40">
                      <X size={16} />
                    </button>
                  </div>
                  <WorkoutTimer
                    initialSeconds={restDuration}
                    autoStart={true}
                    compact={true}
                    onComplete={() => setShowRestTimer(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-2">
              {currentExerciseIdx > 0 && (
                <button
                  onClick={() => setCurrentExerciseIdx((i) => i - 1)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
              )}
              {currentExerciseIdx < activeWorkout.exercises.length - 1 && (
                <button
                  onClick={() => setCurrentExerciseIdx((i) => i + 1)}
                  className="btn-forge flex-1 flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ChevronRight size={18} />
                </button>
              )}
              {currentExerciseIdx === activeWorkout.exercises.length - 1 && (
                <button
                  onClick={handleFinish}
                  className="btn-forge flex-1 flex items-center justify-center gap-2 bg-forge-green"
                  style={{ background: 'linear-gradient(135deg, #4ADE80, #22c55e)' }}
                >
                  <Check size={18} />
                  Finalizar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Routines list view
  return (
    <div className="flex flex-col pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-display text-3xl text-gradient-forge">ENTRENAR</h1>
        <p className="text-forge-white/50 text-sm">Elige o crea tu rutina</p>
      </div>

      {/* AI Button */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setView('ai')}
          className="w-full card-metal p-4 flex items-center gap-4 border-forge-orange/30 hover:border-forge-orange/60 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}>
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-forge-white">Generar con FORGE IA</div>
            <div className="text-xs text-forge-white/50">Plan 100% personalizado para ti</div>
          </div>
          <ChevronRight size={18} className="ml-auto text-forge-orange" />
        </button>
      </div>

      {/* Routines */}
      <div className="px-4">
        <h3 className="font-semibold text-forge-white mb-3">Rutinas disponibles</h3>
        <div className="flex flex-col gap-3">
          {routines.map((routine) => {
            const color = categoryColors[routine.category] ?? '#FF6B1A'
            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-metal p-4"
                style={{ borderColor: `${color}20` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Dumbbell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-forge-white">{routine.name}</div>
                    <div className="text-xs text-forge-white/50 mt-0.5">{routine.description}</div>
                  </div>
                  {routine.isAIGenerated && (
                    <span className="text-xs bg-forge-orange/20 text-forge-orange px-2 py-0.5 rounded-full flex-shrink-0">IA</span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3 text-xs text-forge-white/50">
                  <span>{routine.exercises.length} ejercicios</span>
                  <span>•</span>
                  <span>{routine.frequency}</span>
                  <span>•</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: i < routine.difficulty ? color : '#2A2A30' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      startWorkout(routine)
                      setView('active')
                    }}
                    className="btn-forge flex-1 flex items-center justify-center gap-2 py-2 text-sm"
                  >
                    <Play size={14} />
                    Iniciar
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Rank-up celebration */}
      {currentRankUp && (
        <RankUpModal
          muscle={currentRankUp.muscle}
          fromTier={currentRankUp.from}
          toTier={currentRankUp.to}
          xpGained={currentRankUp.xp}
          onClose={handleRankUpClose}
        />
      )}
    </div>
  )
}

export default WorkoutPage
