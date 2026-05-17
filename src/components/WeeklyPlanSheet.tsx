import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, ChevronLeft, ChevronRight,
  Dumbbell, Trash2, Play, Calendar,
  Check, Search, Zap,
} from 'lucide-react'
import {
  useWeeklyPlanStore,
  WEEK_DAYS, WEEK_DAY_FULL, WEEK_DAY_LABELS,
  type WeekDay, type WeeklyPlan,
} from '../store/weeklyPlanStore'
import { useWorkoutStore } from '../store/workoutStore'
import type { Routine } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  push: '#FF6B1A', pull: '#60A5FA', legs: '#C084FC',
  fullbody: '#4ADE80', hiit: '#F87171', custom: '#FFA052',
}

const TODAY_KEY = (() => {
  const days: WeekDay[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return days[new Date().getDay()]
})()

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
  onStartRoutine: (routineId: string) => void
}

type View = 'list' | 'editor' | 'picker'

// ─── Helper: estimate routine minutes ────────────────────────────────────────
function estimateMin(r: Routine) {
  return Math.max(20, r.exercises.length * 8)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyPlans({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.2)' }}
      >
        <Calendar size={36} style={{ color: '#FF6B1A' }} />
      </div>
      <h3 className="font-display text-2xl text-white mb-2">Sin plan activo</h3>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Crea tu plan semanal y FORGE te recuerda qué entrenar cada día
      </p>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onNew}
        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white text-sm"
        style={{ background: 'linear-gradient(135deg,#FF6B1A,#FFA052)', boxShadow: '0 6px 24px rgba(255,107,26,0.4)' }}
      >
        <Plus size={16} />
        Crear mi plan semanal
      </motion.button>
    </div>
  )
}

function PlanCard({
  plan, onEdit, onActivate, onStart,
}: {
  plan: WeeklyPlan
  onEdit: () => void
  onActivate: () => void
  onStart: (routineId: string) => void
}) {
  const { routines } = useWorkoutStore()
  const daysCount = Object.keys(plan.assignments).length
  const todayRoutineId = plan.assignments[TODAY_KEY]
  const todayRoutine = todayRoutineId ? routines.find(r => r.id === todayRoutineId) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: plan.isActive ? 'rgba(255,107,26,0.06)' : 'rgba(255,255,255,0.03)',
        border: plan.isActive ? '1.5px solid rgba(255,107,26,0.35)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {plan.isActive && (
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#FF6B1A,transparent)' }} />
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-white text-base">{plan.name}</p>
              {plan.isActive && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,107,26,0.2)', color: '#FF6B1A' }}
                >
                  ACTIVO
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {daysCount} día{daysCount !== 1 ? 's' : ''}/semana
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </motion.button>
        </div>

        {/* Day strip */}
        <div className="flex gap-1.5 mb-3">
          {WEEK_DAYS.map(day => {
            const rid = plan.assignments[day]
            const routine = rid ? useWorkoutStore.getState().routines.find(r => r.id === rid) : null
            const isToday = day === TODAY_KEY
            const color = routine ? (CAT_COLOR[routine.category] ?? '#FF6B1A') : 'rgba(255,255,255,0.08)'
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full h-1 rounded-full"
                  style={{ background: rid ? color : 'rgba(255,255,255,0.08)' }}
                />
                <span
                  className="text-[9px] font-bold"
                  style={{ color: isToday ? '#FF6B1A' : rid ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}
                >
                  {WEEK_DAY_LABELS[day]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Today's workout or action buttons */}
        {plan.isActive && todayRoutine ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(todayRoutine.id)}
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#FF6B1A,#FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.35)' }}
          >
            <Play size={13} fill="white" />
            Entreno de hoy: {todayRoutine.name}
          </motion.button>
        ) : !plan.isActive ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onActivate}
            className="w-full py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.2)', color: '#FF6B1A' }}
          >
            Activar este plan
          </motion.button>
        ) : (
          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Hoy es día de descanso 🛡
          </p>
        )}
      </div>
    </motion.div>
  )
}

function PlanEditor({
  draft, routines, onBack, onSave, onDelete, onPickRoutine,
}: {
  draft: Partial<WeeklyPlan>
  routines: Routine[]
  onBack: () => void
  onSave: (name: string) => void
  onDelete?: () => void
  onPickRoutine: (day: WeekDay) => void
}) {
  const [name, setName] = useState(draft.name ?? '')
  const assignments = draft.assignments ?? {}
  const isEditing = !!draft.id

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ChevronLeft size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
        </motion.button>
        <h2 className="font-display text-xl text-white flex-1">
          {isEditing ? 'Editar plan' : 'Nuevo plan'}
        </h2>
        {onDelete && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Trash2 size={15} style={{ color: '#EF4444' }} />
          </motion.button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32" style={{ scrollbarWidth: 'none' }}>
        {/* Name input */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Nombre del plan
          </p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Volumen 4 días, PPL, Full body..."
            className="w-full px-4 py-3.5 rounded-2xl text-sm text-white font-medium outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              caretColor: '#FF6B1A',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(255,107,26,0.5)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Days grid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Asignar rutinas por día
            </p>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {Object.keys(assignments).length} días asignados
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {WEEK_DAYS.map(day => {
              const rid = assignments[day]
              const routine = rid ? routines.find(r => r.id === rid) : null
              const color = routine ? (CAT_COLOR[routine.category] ?? '#FF6B1A') : undefined
              const isToday = day === TODAY_KEY

              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onPickRoutine(day)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{
                    background: routine ? `${color}0D` : 'rgba(255,255,255,0.03)',
                    border: routine ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Day label */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{
                      background: isToday ? 'rgba(255,107,26,0.2)' : (routine ? `${color}18` : 'rgba(255,255,255,0.05)'),
                      color: isToday ? '#FF6B1A' : (routine ? color : 'rgba(255,255,255,0.3)'),
                      border: isToday ? '1.5px solid rgba(255,107,26,0.4)' : 'none',
                    }}
                  >
                    {WEEK_DAY_LABELS[day]}
                  </div>

                  {/* Day name + routine */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold" style={{ color: isToday ? '#FF6B1A' : 'rgba(255,255,255,0.6)' }}>
                        {WEEK_DAY_FULL[day]}
                        {isToday && <span className="ml-1 text-[9px] font-bold opacity-60">· HOY</span>}
                      </p>
                    </div>
                    {routine ? (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: color ?? 'rgba(255,255,255,0.5)' }}>
                        {routine.name}
                      </p>
                    ) : (
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        Descanso — Toca para asignar
                      </p>
                    )}
                  </div>

                  {/* Right indicator */}
                  {routine ? (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                  ) : (
                    <Plus size={14} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Save button fixed at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4"
        style={{ background: 'linear-gradient(to top, #0A0A0F 80%, transparent)' }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSave(name.trim() || 'Mi Plan')}
          disabled={!name.trim()}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
          style={{
            background: name.trim()
              ? 'linear-gradient(135deg,#FF6B1A,#FFA052)'
              : 'rgba(255,255,255,0.06)',
            boxShadow: name.trim() ? '0 6px 24px rgba(255,107,26,0.4)' : 'none',
            color: name.trim() ? 'white' : 'rgba(255,255,255,0.2)',
          }}
        >
          <Check size={16} />
          {isEditing ? 'Guardar cambios' : 'Crear y activar plan'}
        </motion.button>
      </div>
    </div>
  )
}

function RoutinePicker({
  day, routines, currentId, onPick, onClear, onClose,
}: {
  day: WeekDay
  routines: Routine[]
  currentId: string | undefined
  onPick: (routineId: string) => void
  onClear: () => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() =>
    routines.filter(r => r.name.toLowerCase().includes(query.toLowerCase())),
    [routines, query]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Asignar rutina a
          </p>
          <h2 className="font-display text-xl text-white">{WEEK_DAY_FULL[day]}</h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar rutina..."
            className="flex-1 bg-transparent text-sm text-white outline-none"
            style={{ caretColor: '#FF6B1A' }}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Routine list */}
      <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ scrollbarWidth: 'none' }}>
        {/* Rest day option */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClear}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-3 text-left"
          style={{
            background: !currentId ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
            border: !currentId ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'rgba(52,211,153,0.1)' }}
          >
            🛡
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: '#34D399' }}>Día de descanso</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sin entreno programado
            </p>
          </div>
          {!currentId && <Check size={16} style={{ color: '#34D399' }} />}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {filtered.length} rutinas
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {filtered.map(routine => {
          const color = CAT_COLOR[routine.category] ?? '#FF6B1A'
          const isSelected = routine.id === currentId
          const estMin = estimateMin(routine)

          return (
            <motion.button
              key={routine.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPick(routine.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 text-left"
              style={{
                background: isSelected ? `${color}10` : 'rgba(255,255,255,0.03)',
                border: isSelected ? `1.5px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Category dot */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
              >
                {routine.isAIGenerated
                  ? <Zap size={18} style={{ color }} />
                  : <Dumbbell size={18} style={{ color }} />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{routine.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${color}18`, color }}
                  >
                    {routine.category}
                  </span>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {routine.exercises.length} ejerc · ~{estMin}min
                  </span>
                  {routine.isAIGenerated && (
                    <span className="text-[9px] font-bold" style={{ color: '#A78BFA' }}>IA</span>
                  )}
                </div>
              </div>
              {isSelected && <Check size={16} style={{ color, flexShrink: 0 }} />}
            </motion.button>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Sin rutinas con ese nombre
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export const WeeklyPlanSheet: React.FC<Props> = ({ isOpen, onClose, onStartRoutine }) => {
  const { plans, addPlan, updatePlan, deletePlan, setActivePlan } = useWeeklyPlanStore()
  const { routines } = useWorkoutStore()

  const [view, setView] = useState<View>('list')
  const [draft, setDraft] = useState<Partial<WeeklyPlan>>({})
  const [pickingDay, setPickingDay] = useState<WeekDay | null>(null)

  function openNew() {
    setDraft({ name: '', assignments: {}, isActive: false })
    setView('editor')
  }

  function openEdit(plan: WeeklyPlan) {
    setDraft({ ...plan, assignments: { ...plan.assignments } })
    setView('editor')
  }

  function handleSave(name: string) {
    if (draft.id) {
      updatePlan(draft.id, { name, assignments: draft.assignments ?? {} })
    } else {
      addPlan({ name, equipment: '', assignments: draft.assignments ?? {}, isActive: true })
      // Auto-activate new plan: deactivate others first
      plans.forEach(p => updatePlan(p.id, { isActive: false }))
    }
    setView('list')
  }

  function handleDelete() {
    if (draft.id) deletePlan(draft.id)
    setView('list')
  }

  function handlePickRoutine(day: WeekDay) {
    setPickingDay(day)
    setView('picker')
  }

  function handleAssign(routineId: string) {
    if (!pickingDay) return
    setDraft(d => ({ ...d, assignments: { ...d.assignments, [pickingDay]: routineId } }))
    setPickingDay(null)
    setView('editor')
  }

  function handleClearDay() {
    if (!pickingDay) return
    setDraft(d => {
      const next = { ...d.assignments }
      delete next[pickingDay]
      return { ...d, assignments: next }
    })
    setPickingDay(null)
    setView('editor')
  }

  function handleBackFromPicker() {
    setPickingDay(null)
    setView('editor')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setView('list'); onClose() }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
            style={{
              background: '#0D0D12',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px 24px 0 0',
              height: '88vh',
              maxHeight: '88vh',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Content — animated between views */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait" initial={false}>

                {/* LIST VIEW */}
                {view === 'list' && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 pt-4 pb-4 flex-shrink-0">
                      <div className="flex-1">
                        <h2 className="font-display text-2xl text-white">Plan Semanal</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          Programa tus entrenos por día
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setView('list'); onClose() }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </motion.button>
                    </div>

                    {/* Plans or empty state */}
                    {plans.length === 0 ? (
                      <EmptyPlans onNew={openNew} />
                    ) : (
                      <div
                        className="flex-1 overflow-y-auto px-5 pb-32"
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {/* Active plan first */}
                        {[...plans].sort((a, b) => Number(b.isActive) - Number(a.isActive)).map(plan => (
                          <div key={plan.id} className="mb-3">
                            <PlanCard
                              plan={plan}
                              onEdit={() => openEdit(plan)}
                              onActivate={() => setActivePlan(plan.id)}
                              onStart={onStartRoutine}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New plan button */}
                    {plans.length > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4"
                        style={{ background: 'linear-gradient(to top, #0D0D12 80%, transparent)' }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={openNew}
                          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
                          style={{
                            background: 'rgba(255,107,26,0.1)',
                            border: '1.5px dashed rgba(255,107,26,0.3)',
                            color: '#FF6B1A',
                          }}
                        >
                          <Plus size={15} />
                          Nuevo plan
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* EDITOR VIEW */}
                {view === 'editor' && (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <PlanEditor
                      draft={draft}
                      routines={routines}
                      onBack={() => setView('list')}
                      onSave={handleSave}
                      onDelete={draft.id ? handleDelete : undefined}
                      onPickRoutine={handlePickRoutine}
                    />
                  </motion.div>
                )}

                {/* PICKER VIEW */}
                {view === 'picker' && pickingDay && (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                    style={{ background: '#0D0D12' }}
                  >
                    <RoutinePicker
                      day={pickingDay}
                      routines={routines}
                      currentId={draft.assignments?.[pickingDay]}
                      onPick={handleAssign}
                      onClear={handleClearDay}
                      onClose={handleBackFromPicker}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
