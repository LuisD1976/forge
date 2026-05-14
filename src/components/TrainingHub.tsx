import React, { useState, useMemo } from 'react'
import { ExerciseAnimation } from './ExerciseAnimation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Plus, ChevronDown, MoreHorizontal, Sparkles,
  Dumbbell, Clock, X, Check, Trash2, Zap, Moon, AlertTriangle, TrendingUp,
} from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { useWeeklyPlanStore, WEEK_DAYS, WEEK_DAY_LABELS, WEEK_DAY_FULL } from '../store/weeklyPlanStore'
import type { WeeklyPlan, WeekDay } from '../store/weeklyPlanStore'
import { EXERCISES } from '../data/exercises'
import type { Routine } from '../types'

const DAYS_JS_TO_KEY: Record<number, WeekDay> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
}
const todayKey = DAYS_JS_TO_KEY[new Date().getDay()]


// ── Today's workout card ──────────────────────────────────────
function TodayCard({ routine, onStart }: { routine: Routine | null; onStart: () => void }) {
  if (!routine) {
    return (
      <div
        className="mx-4 mb-5 rounded-3xl p-5 flex items-center gap-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.25)' }}>
          <Clock size={22} className="text-forge-orange" />
        </div>
        <div>
          <p className="font-bold text-forge-white/50">Sin entrenamiento hoy</p>
          <p className="text-xs text-forge-white/25 mt-0.5">Crea un plan semanal para verlo aquí</p>
        </div>
      </div>
    )
  }

  const totalSets = routine.exercises.reduce((t, e) => t + e.sets, 0)
  const estMins = Math.max(20, routine.exercises.length * 8 + totalSets * 2)
  const muscles = [...new Set(routine.exercises.flatMap(e => {
    const ex = EXERCISES.find(x => x.id === e.exerciseId)
    return ex?.muscles ?? []
  }))]

  return (
    <div className="mx-4 mb-5">
      <p className="text-xs font-bold uppercase tracking-widest text-forge-white/30 mb-2">Entrenamiento de hoy</p>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="rounded-3xl overflow-hidden relative cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #1E1E28, #16161E)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Orange accent top bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #FF6B1A, #FFA052, transparent)' }} />

        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl text-forge-white leading-tight mb-1">
              {routine.name.toUpperCase()}
            </h2>
            <p className="text-forge-white/40 text-sm mb-4">
              {routine.exercises.length} ejercicios · {totalSets} series
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-forge-white/40" />
              <span className="text-forge-white/40 text-sm">{estMins} mins</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {muscles.slice(0, 3).map(m => (
                <span
                  key={m}
                  className="text-xs px-2.5 py-1 rounded-full capitalize"
                  style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A', border: '1px solid rgba(255,107,26,0.3)' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Body illustration placeholder */}
          <div
            className="w-24 h-28 rounded-2xl flex-shrink-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.15), rgba(255,160,82,0.05))' }}
          >
            <Dumbbell size={36} style={{ color: 'rgba(255,107,26,0.5)' }} />
          </div>
        </div>

        {/* Start button */}
        <div className="px-5 pb-5">
          <div
            className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 20px rgba(255,107,26,0.4)' }}
          >
            <Play size={16} fill="white" />
            EMPEZAR ENTRENAMIENTO
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Category color system ─────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string; label: string }> = {
  push:     { bg: 'rgba(255,107,26,0.18)', border: 'rgba(255,107,26,0.55)', text: '#FF6B1A', glow: '0 0 16px rgba(255,107,26,0.35)', label: 'Empuje' },
  pull:     { bg: 'rgba(59,130,246,0.18)',  border: 'rgba(59,130,246,0.55)',  text: '#60A5FA', glow: '0 0 16px rgba(59,130,246,0.35)',  label: 'Tracción' },
  legs:     { bg: 'rgba(168,85,247,0.18)',  border: 'rgba(168,85,247,0.55)',  text: '#C084FC', glow: '0 0 16px rgba(168,85,247,0.35)',  label: 'Piernas' },
  fullbody: { bg: 'rgba(34,197,94,0.18)',   border: 'rgba(34,197,94,0.55)',   text: '#4ADE80', glow: '0 0 16px rgba(34,197,94,0.35)',   label: 'Full Body' },
  hiit:     { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.55)',   text: '#F87171', glow: '0 0 16px rgba(239,68,68,0.35)',   label: 'HIIT' },
  custom:   { bg: 'rgba(255,160,82,0.18)',  border: 'rgba(255,160,82,0.55)',  text: '#FFA052', glow: '0 0 16px rgba(255,160,82,0.35)',  label: 'Custom' },
}
const defCat = CAT_COLORS.custom

function getCat(category: string) { return CAT_COLORS[category] ?? defCat }

function getRoutineMuscles(routine: Routine): string[] {
  const s = new Set<string>()
  routine.exercises.forEach(e => {
    EXERCISES.find(x => x.id === e.exerciseId)?.muscles.forEach(m => s.add(m))
  })
  return [...s].slice(0, 3)
}

function getEstMins(routine: Routine) {
  return Math.max(25, routine.exercises.length * 9 + routine.exercises.reduce((t, e) => t + e.sets, 0) * 2)
}

// ── Smart suggestions ─────────────────────────────────────────
function useSuggestions(assignments: Partial<Record<WeekDay, string>>, routines: Routine[]) {
  return useMemo(() => {
    const assigned = WEEK_DAYS.filter(d => assignments[d])
    const count = assigned.length

    if (count === 0) return null

    // Check consecutive days (3+ in a row)
    let maxConsec = 0, cur = 0
    for (const d of WEEK_DAYS) {
      if (assignments[d]) { cur++; maxConsec = Math.max(maxConsec, cur) } else cur = 0
    }
    if (maxConsec >= 3) return { icon: AlertTriangle, text: 'Añade un día de descanso para recuperarte mejor', color: '#FBBF24' }

    // Check legs consecutive
    const legIds = routines.filter(r => r.category === 'legs').map(r => r.id)
    let legsConsec = 0
    for (const d of WEEK_DAYS) {
      const rid = assignments[d]
      if (rid && legIds.includes(rid)) { legsConsec++; if (legsConsec >= 2) return { icon: AlertTriangle, text: 'Piernas en días seguidos — riesgo de sobreentrenamiento', color: '#F87171' } }
      else legsConsec = 0
    }

    // Check balance
    const cats = assigned.map(d => routines.find(r => r.id === assignments[d])?.category ?? '')
    const hasPush = cats.includes('push'), hasPull = cats.includes('pull')
    if (hasPush && !hasPull) return { icon: TrendingUp, text: 'Agrega tracción (Pull) para equilibrar el plan', color: '#60A5FA' }
    if (!hasPush && hasPull) return { icon: TrendingUp, text: 'Agrega empuje (Push) para equilibrar el plan', color: '#FF6B1A' }

    if (count >= 4 && count <= 5) return { icon: Zap, text: '¡Excelente balance muscular! Plan bien estructurado', color: '#4ADE80' }
    if (count >= 6) return { icon: Zap, text: 'Plan intenso — asegúrate de dormir 8h cada noche', color: '#C084FC' }
    return { icon: Zap, text: 'Plan equilibrado · Sigue así', color: '#4ADE80' }
  }, [assignments, routines])
}

// ── Day card (step 2) ─────────────────────────────────────────
function DayCard({ day, routines, selected, onSelect }: {
  day: WeekDay
  routines: Routine[]
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const routine = selected ? routines.find(r => r.id === selected) : null
  const cat = routine ? getCat(routine.category) : null
  const muscles = routine ? getRoutineMuscles(routine) : []
  const mins = routine ? getEstMins(routine) : 0

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: routine
          ? `linear-gradient(135deg, ${cat!.bg}, rgba(13,13,15,0.95))`
          : 'rgba(255,255,255,0.03)',
        border: routine ? `1.5px solid ${cat!.border}` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: routine ? cat!.glow : 'none',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Day header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <motion.div
          animate={{ scale: routine ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-display text-base flex-shrink-0"
          style={{
            background: routine ? cat!.bg : 'rgba(255,255,255,0.05)',
            border: routine ? `1.5px solid ${cat!.border}` : '1px solid rgba(255,255,255,0.08)',
            color: routine ? cat!.text : 'rgba(255,255,255,0.3)',
            boxShadow: routine ? cat!.glow : 'none',
          }}
        >
          {WEEK_DAY_LABELS[day]}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: routine ? '#fff' : 'rgba(255,255,255,0.35)' }}>
              {WEEK_DAY_FULL[day]}
            </span>
            {routine && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: cat!.bg, color: cat!.text, border: `1px solid ${cat!.border}` }}
              >
                {getCat(routine.category).label}
              </motion.span>
            )}
          </div>

          {routine ? (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mt-0.5">
              <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <Clock size={10} />
                {mins}min
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {muscles.join(', ')}
              </span>
            </motion.div>
          ) : (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Descanso</span>
          )}
        </div>

        {/* Intensity dots + clear */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {routine && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-3 rounded-full"
                  style={{ background: i < (routine.difficulty ?? 3) ? cat!.text : 'rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>
          )}
          {routine && (
            <button
              onClick={e => { e.stopPropagation(); onSelect(null) }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X size={11} className="text-forge-white/50" />
            </button>
          )}
          {!routine && <Moon size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />}
        </div>
      </div>

      {/* Routine chips */}
      {routines.length > 0 ? (
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {routines.map(r => {
            const rc = getCat(r.category)
            const isSelected = selected === r.id
            return (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSelect(isSelected ? null : r.id)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                animate={{
                  background: isSelected ? rc.bg : 'rgba(255,255,255,0.05)',
                  boxShadow: isSelected ? rc.glow : 'none',
                }}
                style={{
                  border: isSelected ? `1.5px solid ${rc.border}` : '1px solid rgba(255,255,255,0.07)',
                  color: isSelected ? rc.text : 'rgba(255,255,255,0.4)',
                }}
              >
                {isSelected && <Check size={10} />}
                {r.name}
                {r.isAIGenerated && <Sparkles size={9} style={{ opacity: 0.7 }} />}
              </motion.button>
            )
          })}
        </div>
      ) : (
        <p className="px-4 pb-4 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Crea rutinas primero para asignarlas
        </p>
      )}
    </motion.div>
  )
}

// ── Create Plan Modal ─────────────────────────────────────────
function CreatePlanModal({ routines, onClose }: { routines: Routine[]; onClose: () => void }) {
  const { addPlan, plans } = useWeeklyPlanStore()
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('Gimnasio')
  const [assignments, setAssignments] = useState<Partial<Record<WeekDay, string>>>({})
  const [step, setStep] = useState<'info' | 'days'>('info')
  const suggestion = useSuggestions(assignments, routines)

  const assignedCount = WEEK_DAYS.filter(d => assignments[d]).length
  const totalMins = WEEK_DAYS.reduce((t, d) => {
    const r = routines.find(x => x.id === assignments[d])
    return t + (r ? getEstMins(r) : 0)
  }, 0)
  const allMuscles = [...new Set(
    WEEK_DAYS.flatMap(d => {
      const r = routines.find(x => x.id === assignments[d])
      return r ? getRoutineMuscles(r) : []
    })
  )]

  const handleSave = () => {
    if (!name.trim()) return
    const isFirst = plans.length === 0
    addPlan({ name: name.trim(), equipment, assignments, isActive: isFirst })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #16161E 0%, #0F0F16 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          maxHeight: '90vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-display text-2xl text-forge-white">Crear plan</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {step === 'info' ? 'Ponle nombre y elige equipamiento' : 'Asigna rutinas a cada día'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <X size={16} className="text-forge-white/50" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex gap-1.5">
            {(['info', 'days'] as const).map((s, i) => (
              <div
                key={s}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  flex: step === s ? 2 : 1,
                  background: step === s ? '#FF6B1A' : i < (['info', 'days'].indexOf(step)) ? 'rgba(255,107,26,0.4)' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">
            {step === 'info' ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-5 pb-6 flex flex-col gap-5"
              >
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-forge-white/30 uppercase tracking-widest mb-2 block">
                    Nombre del plan
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ej: Fuerza 5 días, PPL semana..."
                    className="w-full rounded-2xl px-4 py-3.5 text-forge-white text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px solid rgba(255,107,26,0.3)',
                      caretColor: '#FF6B1A',
                    }}
                    onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(255,107,26,0.9)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,26,0.12)' }}
                    onBlur={e => { e.currentTarget.style.border = '1.5px solid rgba(255,107,26,0.3)'; e.currentTarget.style.boxShadow = 'none' }}
                    autoFocus
                  />
                </div>

                {/* Equipment */}
                <div>
                  <label className="text-[10px] font-bold text-forge-white/30 uppercase tracking-widest mb-3 block">
                    Equipamiento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Gimnasio', icon: '🏋️', desc: 'Pesas y máquinas' },
                      { id: 'Equipo en Casa', icon: '🏠', desc: 'Mancuernas básicas' },
                      { id: 'Sin Equipamiento', icon: '🤸', desc: 'Solo tu cuerpo' },
                      { id: 'Exterior', icon: '🌿', desc: 'Parque / aire libre' },
                    ].map(eq => {
                      const isSelected = equipment === eq.id
                      return (
                        <motion.button
                          key={eq.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEquipment(eq.id)}
                          className="rounded-2xl p-3.5 text-left transition-all"
                          style={{
                            background: isSelected ? 'rgba(255,107,26,0.15)' : 'rgba(255,255,255,0.04)',
                            border: isSelected ? '1.5px solid rgba(255,107,26,0.6)' : '1px solid rgba(255,255,255,0.07)',
                            boxShadow: isSelected ? '0 0 16px rgba(255,107,26,0.2)' : 'none',
                          }}
                        >
                          <div className="text-xl mb-1">{eq.icon}</div>
                          <div className="text-sm font-bold" style={{ color: isSelected ? '#FF6B1A' : 'rgba(255,255,255,0.7)' }}>
                            {eq.id}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{eq.desc}</div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="days"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="px-5 pb-6 flex flex-col gap-3"
              >
                {/* Weekly summary */}
                <div
                  className="rounded-2xl p-4 flex gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex-1 text-center">
                    <div className="font-display text-2xl text-forge-white">{assignedCount}</div>
                    <div className="text-[10px] text-forge-white/30 mt-0.5">DÍAS</div>
                  </div>
                  <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="flex-1 text-center">
                    <div className="font-display text-2xl text-forge-white">{totalMins}min</div>
                    <div className="text-[10px] text-forge-white/30 mt-0.5">TOTAL</div>
                  </div>
                  <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="flex-1 text-center">
                    <div className="font-display text-2xl text-forge-white">{allMuscles.length}</div>
                    <div className="text-[10px] text-forge-white/30 mt-0.5">GRUPOS</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    <span>Días entrenados</span>
                    <span style={{ color: assignedCount >= 4 ? '#4ADE80' : 'rgba(255,255,255,0.25)' }}>{assignedCount}/7</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      animate={{ width: `${(assignedCount / 7) * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: assignedCount >= 5 ? 'linear-gradient(90deg,#4ADE80,#22C55E)' : 'linear-gradient(90deg,#FF6B1A,#FFA052)' }}
                    />
                  </div>
                </div>

                {/* Smart suggestion */}
                <AnimatePresence>
                  {suggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="rounded-2xl px-4 py-3 flex items-center gap-3"
                      style={{ background: `${suggestion.color}14`, border: `1px solid ${suggestion.color}35` }}
                    >
                      <suggestion.icon size={15} style={{ color: suggestion.color, flexShrink: 0 }} />
                      <span className="text-xs font-medium" style={{ color: suggestion.color }}>{suggestion.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Day cards */}
                {WEEK_DAYS.map((day, i) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <DayCard
                      day={day}
                      routines={routines}
                      selected={assignments[day] ?? null}
                      onSelect={id => setAssignments(prev => {
                        if (!id) { const n = { ...prev }; delete n[day]; return n }
                        return { ...prev, [day]: id }
                      })}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom actions */}
        <div
          className="px-5 pt-3 pb-8 flex gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,13,15,0.95)' }}
        >
          {step === 'info' ? (
            <>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={18} className="text-forge-white/40" />
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => name.trim() && setStep('days')}
                disabled={!name.trim()}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-35"
                style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 20px rgba(255,107,26,0.4)' }}
              >
                Asignar días →
              </motion.button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('info')}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={18} className="text-forge-white/40" />
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 20px rgba(255,107,26,0.4)' }}
              >
                <Check size={16} />
                Guardar plan {assignedCount > 0 && `· ${assignedCount} días`}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Plan card ─────────────────────────────────────────────────
function PlanCard({ plan, routines, onStart, onSetActive, onDelete }: {
  plan: WeeklyPlan
  routines: Routine[]
  onStart: (routineId: string) => void
  onSetActive: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const activeDays = WEEK_DAYS.filter(d => plan.assignments[d])
  const assignedDays = Object.keys(plan.assignments) as WeekDay[]

  return (
    <div
      className="rounded-3xl overflow-hidden mb-3"
      style={{
        background: '#13131A',
        border: plan.isActive ? '1.5px solid rgba(255,107,26,0.4)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: plan.isActive ? '0 0 24px rgba(255,107,26,0.1)' : 'none',
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-start gap-3 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-forge-white text-base leading-tight truncate">
              {plan.name.toUpperCase()}
            </h3>
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} className="text-forge-white/40 flex-shrink-0" />
            </motion.div>
          </div>
          <p className="text-forge-white/40 text-xs">
            {plan.equipment} · {activeDays.length} días
          </p>

          {/* Day pills */}
          <div className="flex gap-1.5 mt-3">
            {WEEK_DAYS.map(day => {
              const hasWorkout = !!plan.assignments[day]
              const isToday = day === todayKey
              return (
                <div
                  key={day}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: hasWorkout
                      ? isToday ? '#FF6B1A' : 'rgba(255,107,26,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    color: hasWorkout
                      ? isToday ? '#fff' : 'rgba(255,107,26,0.9)'
                      : 'rgba(255,255,255,0.2)',
                    border: isToday ? '2px solid #FF6B1A' : '1px solid transparent',
                  }}
                >
                  {WEEK_DAY_LABELS[day]}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {plan.isActive && (
            <span className="text-xs font-semibold" style={{ color: '#FF6B1A' }}>
              Activa
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(s => !s) }}
            className="relative"
          >
            <MoreHorizontal size={18} className="text-forge-white/30" />
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-6 rounded-2xl overflow-hidden z-10 w-44"
                  style={{ background: '#1E1E28', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  onClick={e => e.stopPropagation()}
                >
                  {!plan.isActive && (
                    <button
                      onClick={() => { onSetActive(); setShowMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-forge-white hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <Check size={14} className="text-forge-orange" />
                      Activar plan
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(); setShowMenu(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Eliminar plan
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Expanded: day-by-day */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="days"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {assignedDays.map(day => {
                const routineId = plan.assignments[day]!
                const routine = routines.find(r => r.id === routineId)
                if (!routine) return null
                const exImages = routine.exercises.slice(0, 2).map(e => EXERCISES.find(x => x.id === e.exerciseId))
                const isToday = day === todayKey

                return (
                  <div
                    key={day}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: isToday ? 'rgba(255,107,26,0.06)' : '#0D0D10',
                      border: isToday ? '1px solid rgba(255,107,26,0.3)' : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                      <h4 className="font-display text-lg text-forge-white">{WEEK_DAY_FULL[day]}</h4>
                      {isToday && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,107,26,0.2)', color: '#FF6B1A' }}>
                          Hoy
                        </span>
                      )}
                    </div>

                    {/* Exercise thumbnails */}
                    <div className="px-4 pb-3 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                      {exImages.map((ex, i) => ex && (
                        <div key={i} className="flex items-center gap-2 flex-shrink-0">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${CAT_COLORS[routine.category]?.bg ?? 'rgba(255,107,26,0.12)'}` }}
                          >
                            <ExerciseAnimation
                              exerciseId={ex.id} muscles={ex.muscles}
                              color={CAT_COLORS[routine.category]?.text ?? '#FF6B1A'} size={44}
                            />
                          </div>
                          <span className="text-xs text-forge-white/60 max-w-[80px] leading-tight">{ex.name}</span>
                        </div>
                      ))}
                      {routine.exercises.length > 2 && (
                        <div className="flex items-center">
                          <span className="text-xs text-forge-white/30">+{routine.exercises.length - 2} más</span>
                        </div>
                      )}
                    </div>

                    {/* Start button */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => onStart(routineId)}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                        style={{
                          background: isToday
                            ? 'linear-gradient(135deg, #FF6B1A, #FFA052)'
                            : 'rgba(255,255,255,0.06)',
                          color: isToday ? '#fff' : 'rgba(255,255,255,0.5)',
                          boxShadow: isToday ? '0 4px 16px rgba(255,107,26,0.35)' : 'none',
                        }}
                      >
                        <Play size={14} fill={isToday ? '#fff' : 'rgba(255,255,255,0.5)'} />
                        EMPEZAR ENTRENAMIENTO
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main TrainingHub ──────────────────────────────────────────
interface TrainingHubProps {
  onStartRoutine: (routineId: string) => void
  onStartFree: () => void
  onOpenAI: () => void
}

export const TrainingHub: React.FC<TrainingHubProps> = ({ onStartRoutine, onStartFree, onOpenAI }) => {
  const { routines } = useWorkoutStore()
  const { plans, getTodayRoutineId, setActivePlan: activatePlan, deletePlan } = useWeeklyPlanStore()
  const [showCreatePlan, setShowCreatePlan] = useState(false)

  const todayRoutineId = getTodayRoutineId()
  const todayRoutine = todayRoutineId ? routines.find(r => r.id === todayRoutineId) ?? null : null

  return (
    <div className="flex flex-col pb-28" style={{ background: '#0D0D0F', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-5">
        <h1 className="font-display text-4xl text-forge-white">Entrenar</h1>
        <p className="text-forge-white/30 text-sm mt-1">Tu entrenamiento, tu ritmo</p>
      </div>

      {/* Today's workout */}
      <TodayCard routine={todayRoutine} onStart={() => todayRoutineId && onStartRoutine(todayRoutineId)} />

      {/* Planificaciones */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-forge-white/30">Planificaciones</p>
          <button
            onClick={() => setShowCreatePlan(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A' }}
          >
            <Plus size={12} />
            Crear
          </button>
        </div>

        {plans.length > 0 ? (
          plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              routines={routines}
              onStart={onStartRoutine}
              onSetActive={() => activatePlan(plan.id)}
              onDelete={() => deletePlan(plan.id)}
            />
          ))
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreatePlan(true)}
            className="w-full rounded-3xl py-5 flex items-center justify-center gap-2"
            style={{ border: '1.5px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
          >
            <Plus size={16} />
            <span className="text-sm font-medium">Crear planificación semanal</span>
          </motion.button>
        )}
      </div>

      {/* Mis Rutinas */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-forge-white/30">Mis Rutinas</p>
          <button
            onClick={onOpenAI}
            className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A' }}
          >
            <Sparkles size={12} />
            Generar IA
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {routines.map(routine => {
            const totalSets = routine.exercises.reduce((t, e) => t + e.sets, 0)
            const estMins = Math.max(20, routine.exercises.length * 8)
            return (
              <motion.div
                key={routine.id}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.25)' }}
                  >
                    <Dumbbell size={20} className="text-forge-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-forge-white truncate">{routine.name}</p>
                    <p className="text-forge-white/40 text-xs mt-0.5">
                      {routine.exercises.length} ejercicios · {totalSets} series · ~{estMins}min
                    </p>
                  </div>
                  {routine.isAIGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0" style={{ background: 'rgba(255,107,26,0.15)', color: '#FF6B1A' }}>IA</span>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onStartRoutine(routine.id)}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
                    style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.3)' }}
                  >
                    <Play size={14} fill="white" />
                    EMPEZAR ENTRENAMIENTO
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Add routine / free workout */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStartFree}
          className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 mb-3"
          style={{ border: '1.5px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Entreno libre</span>
        </motion.button>
      </div>

      {/* Create plan modal */}
      <AnimatePresence>
        {showCreatePlan && (
          <CreatePlanModal
            routines={routines}
            onClose={() => setShowCreatePlan(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default TrainingHub
