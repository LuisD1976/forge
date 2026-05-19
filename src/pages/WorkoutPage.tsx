import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, X, Check, Clock,
  ChevronLeft, Sparkles, Trophy, Share2,
} from 'lucide-react'
import { SmartWorkoutHub } from '../components/SmartWorkoutHub'
import { ExerciseAnimation } from '../components/ExerciseAnimation'
import { ExercisePicker } from '../components/ExercisePicker'
import { useWorkoutStore } from '../store/workoutStore'
import { useRanksStore } from '../store/ranksStore'
import { usePRStore } from '../store/prStore'
import { useAchievementsStore } from '../store/achievementsStore'
import { useSocialStore } from '../store/socialStore'
import { useUserStore } from '../store/userStore'
import { EXERCISES } from '../data/exercises'
import { ALL_STATIC_ROUTINES } from '../data/challenges'
import { SetLogger } from '../components/SetLogger'
import { WorkoutTimer } from '../components/WorkoutTimer'
import { RankUpModal } from '../components/RankUpModal'
import { estimateOneRM, calculateXPForSet } from '../utils/rankCalculator'
import { generateRoutineWithAI } from '../utils/claudeAPI'
import { syncWorkoutSession, syncMuscleRanks, syncRoutine } from '../lib/sync'
import { supabase } from '../lib/supabase'
import { toast } from '../store/toastStore'
import type { MuscleGroup, RankTier, PersonalRecord } from '../types'
import { RANK_ORDER } from '../data/ranks'

type WorkoutView = 'routines' | 'active' | 'summary' | 'ai'

interface RankUpEvent { muscle: MuscleGroup; from: RankTier; to: RankTier; xp: number }

interface WorkoutPageProps {
  initialRoutineId?: string | null
  onClose?: () => void
}

export const WorkoutPage: React.FC<WorkoutPageProps> = ({ initialRoutineId, onClose }) => {
  const { routines, sessions, activeWorkout, startWorkout, addSet, updateSet, toggleSetComplete, finishWorkout, cancelWorkout, addRoutine, getStreak, addExerciseToWorkout, replaceExercise } = useWorkoutStore()
  const { addXP, updateRank, muscleRanks } = useRanksStore()
  const { checkAndUpdatePR, records: prRecords } = usePRStore()
  const { unlock: unlockAchievements } = useAchievementsStore()
  const { addPost } = useSocialStore()
  const { user } = useUserStore()

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
  const [shared, setShared] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<'add' | 'replace'>('add')
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null)

  // Auto-start if routineId provided — also searches static challenge/warmup routines
  useEffect(() => {
    if (initialRoutineId && !activeWorkout) {
      const routine =
        routines.find((r) => r.id === initialRoutineId) ??
        ALL_STATIC_ROUTINES.find((r) => r.id === initialRoutineId)
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
      syncWorkoutSession(session, user.id).catch(() => {
        toast.warning('Entreno guardado localmente. Se sincronizará cuando haya conexión.')
      })
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
      toast.success(`Rutina "${routine.name}" creada con IA`)
      setTimeout(() => { setView('routines'); setAiSuccessName(null) }, 2000)
    } else {
      setAiError(true)
      toast.error('No se pudo generar la rutina con IA. Verifica tu conexión.')
    }
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
    const totalCompletedSets = completedSession.exercises?.reduce((t: number, ex: any) => t + (ex.sets?.filter((s: any) => s.completed)?.length ?? 0), 0) ?? 0

    return (
      <div className="flex flex-col min-h-screen pb-8 overflow-y-auto" style={{ background: 'linear-gradient(160deg, #1a0a00 0%, #0D0D0F 50%)' }}>
        {/* Hero area */}
        <div className="flex flex-col items-center pt-16 pb-8 px-6 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,26,0.15) 0%, transparent 65%)' }} />

          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-7xl mb-4"
          >
            🔥
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: '#FF6B1A' }}>ENTRENO COMPLETADO</p>
            <h2 className="font-display text-4xl text-white leading-tight">{completedSession.name}</h2>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date(completedSession.date).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>
        </div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 mb-4"
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Minutos', value: completedSession.duration, color: '#FF6B1A', emoji: '⏱' },
              { label: 'Volumen', value: `${(completedSession.totalVolume / 1000).toFixed(1)}t`, color: '#60A5FA', emoji: '📊' },
              { label: 'XP ganados', value: `+${completedSession.xpGained}`, color: '#4ADE80', emoji: '⚡' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="rounded-2xl p-3.5 text-center"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
              >
                <div className="text-xl mb-0.5">{s.emoji}</div>
                <div className="font-display text-xl text-white">{s.value}</div>
                <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sets completed */}
        {totalCompletedSets > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="px-4 mb-4"
          >
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,107,26,0.07)', border: '1px solid rgba(255,107,26,0.2)' }}>
              <p className="font-display text-3xl text-white">{totalCompletedSets}</p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>series completadas</p>
            </div>
          </motion.div>
        )}

        {/* Personal Records */}
        {newPRs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-4 mb-4"
          >
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.3)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} style={{ color: '#FFD700' }} />
                <span className="font-bold text-white text-sm">¡Nuevos récords personales! 🏆</span>
              </div>
              <div className="flex flex-col gap-2">
                {newPRs.map((pr) => (
                  <div key={pr.exerciseId} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{pr.exerciseName}</span>
                    <span className="font-mono font-bold ml-3 flex-shrink-0" style={{ color: '#FFD700' }}>
                      {pr.weight}kg × {pr.reps}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Share + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="px-4 flex flex-col gap-3"
        >
          {/* Share button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (shared || !completedSession) return
              const post = {
                id: `post_${Date.now()}`,
                userId: user?.id ?? 'local',
                username: user?.username ?? 'forger',
                avatar: user?.avatar ?? '',
                content: `🔥 Acabo de completar "${completedSession.name}"!\n⏱ ${completedSession.duration} min · 📊 ${(completedSession.totalVolume / 1000).toFixed(1)}t · ⚡ +${completedSession.xpGained} XP\n#FORGE #FitnessMotivation`,
                likes: 0,
                comments: 0,
                timeAgo: 'ahora mismo',
                hasLiked: false,
                workoutSummary: {
                  name: completedSession.name,
                  duration: completedSession.duration,
                  exercises: completedSession.exercises.length,
                  volume: completedSession.totalVolume,
                  xp: completedSession.xpGained,
                },
              }
              addPost(post)
              supabase.auth.getUser().then(({ data: { user: u } }) => {
                if (!u) return
                supabase.from('posts').insert({
                  id: post.id,
                  user_id: u.id,
                  content: post.content,
                  workout_summary: post.workoutSummary,
                } as never).then(null, console.error)
              })
              setShared(true)
              toast.success('Entreno publicado en el feed 🎉')
            }}
            disabled={shared}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
            style={{
              background: shared ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.07)',
              border: shared ? '1.5px solid rgba(74,222,128,0.4)' : '1.5px solid rgba(255,255,255,0.12)',
              color: shared ? '#4ADE80' : 'rgba(255,255,255,0.7)',
            }}
          >
            <Share2 size={16} />
            {shared ? 'Publicado en el feed ✓' : 'Compartir entreno'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setView('routines'); onClose?.() }}
            className="w-full py-4 rounded-2xl font-bold text-white font-display text-xl"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 6px 30px rgba(255,107,26,0.4)' }}
          >
            SEGUIR FORJANDO ⚡
          </motion.button>
        </motion.div>
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
    const liveVolume = activeWorkout.exercises.reduce((t, ex) =>
      t + ex.sets.filter(s => s.completed).reduce((s2, s) => s2 + s.weight * s.reps, 0), 0
    )
    const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

    return (
      <div className="flex flex-col min-h-screen bg-forge-black pb-8">
        {/* Header */}
        <div className="px-4 pt-12 pb-4" style={{ background: 'linear-gradient(180deg, #13131A 0%, #0D0D10 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleCancel} className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-white text-sm truncate max-w-[160px]">{activeWorkout.name}</h2>
              <div className="flex items-center gap-2 justify-center mt-0.5">
                <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#FF6B1A' }}>
                  <Clock size={10} />
                  {formatElapsed(elapsed)}
                </div>
                {liveVolume > 0 && (
                  <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    · {(liveVolume / 1000).toFixed(1)}t
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #4ADE80, #22c55e)', color: '#fff', boxShadow: '0 2px 10px rgba(74,222,128,0.3)' }}
            >
              Finalizar
            </button>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>{completedSets} / {totalSets} series</span>
              <span className="font-bold" style={{ color: progressPct === 100 ? '#4ADE80' : '#FF6B1A' }}>
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: progressPct === 100 ? 'linear-gradient(90deg,#4ADE80,#22c55e)' : 'linear-gradient(90deg,#FF6B1A,#FFA052)' }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Exercise tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {activeWorkout.exercises.map((ex, i) => {
            const exData = EXERCISES.find((e) => e.id === ex.exerciseId)
            const done = ex.sets.filter((s) => s.completed).length
            const total = ex.sets.length
            const isActive = i === currentExerciseIdx
            const isDone = done === total && total > 0
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.94 }}
                onClick={() => setCurrentExerciseIdx(i)}
                className="flex-shrink-0 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5"
                style={{
                  background: isActive ? '#FF6B1A' : isDone ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#fff' : isDone ? '#4ADE80' : 'rgba(255,255,255,0.5)',
                  border: isActive ? 'none' : isDone ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isActive ? '0 2px 12px rgba(255,107,26,0.4)' : 'none',
                }}
              >
                {isDone && <Check size={10} />}
                {exData?.name.split(' ')[0] ?? ex.exerciseId}
                <span className="font-mono text-[10px] opacity-70">{done}/{total}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Current Exercise */}
        {exercise && currentEx && (
          <div className="flex-1 px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentExerciseIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl overflow-hidden mb-4"
                style={{ background: 'linear-gradient(160deg,rgba(40,38,55,0.7),rgba(18,17,25,0.9))', border: '1px solid rgba(60,58,80,0.6)', backdropFilter: 'blur(12px)' }}
              >
              <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,107,26,0.5),rgba(255,160,82,0.3),transparent)' }} />
              <div className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,107,26,0.12)', border: '1.5px solid rgba(255,107,26,0.25)' }}>
                  <ExerciseAnimation exerciseId={exercise.id} muscles={exercise.muscles} color="#FF6B1A" size={52} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.muscles.map((m) => (
                      <span key={m} className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{ background: 'rgba(255,107,26,0.12)', color: '#FF6B1A', border: '1px solid rgba(255,107,26,0.2)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => { setPickerMode('replace'); setReplaceIdx(currentExerciseIdx); setPickerOpen(true) }}
                    className="text-xs mt-2 font-semibold"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    Cambiar →
                  </button>
                </div>
              </div>

              {/* Progressive overload hint */}
              {(() => {
                const pr = prRecords.find(r => r.exerciseId === currentEx.exerciseId)
                if (!pr) return null
                const suggested = Math.ceil(pr.weight / 2.5) * 2.5 + 2.5
                return (
                  <div className="flex items-center justify-between px-2 mb-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,215,0,0.6)' }}>Último PR</p>
                      <p className="text-xs font-mono font-bold" style={{ color: '#FFD700' }}>
                        {pr.weight}kg × {pr.reps} · 1RM {pr.oneRM.toFixed(0)}kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Hoy intenta</p>
                      <p className="text-sm font-bold font-mono" style={{ color: '#4ADE80' }}>{suggested}kg</p>
                    </div>
                  </div>
                )
              })()}

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
              </motion.div>
            </AnimatePresence>

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
            <div className="flex gap-2 mb-3">
              {currentExerciseIdx > 0 && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCurrentExerciseIdx((i) => i - 1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </motion.button>
              )}
              {currentExerciseIdx < activeWorkout.exercises.length - 1 && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCurrentExerciseIdx((i) => i + 1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.35)' }}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </motion.button>
              )}
              {currentExerciseIdx === activeWorkout.exercises.length - 1 && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFinish}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #4ADE80, #22c55e)', boxShadow: '0 4px 16px rgba(74,222,128,0.4)' }}
                >
                  <Check size={16} />
                  Finalizar entreno
                </motion.button>
              )}
            </div>

            {/* Add exercise button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setPickerMode('add'); setPickerOpen(true) }}
              className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
              style={{ border: '1.5px dashed rgba(255,107,26,0.35)', color: 'rgba(255,107,26,0.7)', backgroundColor: 'rgba(255,107,26,0.04)' }}
            >
              + Agregar ejercicio
            </motion.button>
          </div>
        )}

        {/* Exercise Picker */}
        <ExercisePicker
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          multiSelect={pickerMode === 'add'}
          title={pickerMode === 'add' ? 'Agregar Ejercicio' : 'Cambiar Ejercicio'}
          onConfirm={(exercises) => {
            if (pickerMode === 'add') {
              exercises.forEach(ex => addExerciseToWorkout(ex.id))
            } else if (pickerMode === 'replace' && replaceIdx !== null && exercises[0]) {
              replaceExercise(replaceIdx, exercises[0].id)
            }
          }}
        />
      </div>
    )
  }

  // Training hub view
  return (
    <>
      <SmartWorkoutHub
        onStartRoutine={(routineId) => {
          const routine = routines.find(r => r.id === routineId)
          if (routine) { startWorkout(routine); setView('active') }
        }}
        onStartFree={() => setView('ai')}
        onOpenAI={() => setView('ai')}
      />
      {currentRankUp && (
        <RankUpModal
          muscle={currentRankUp.muscle}
          fromTier={currentRankUp.from}
          toTier={currentRankUp.to}
          xpGained={currentRankUp.xp}
          onClose={handleRankUpClose}
        />
      )}
    </>
  )
}

export default WorkoutPage
