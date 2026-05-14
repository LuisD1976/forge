import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check, ChevronRight, Dumbbell, Zap, Activity } from 'lucide-react'
import { EXERCISES } from '../data/exercises'
import { ExerciseAnimation, getAnimType } from './ExerciseAnimation'
import type { Exercise } from '../types'

// ── Category filters ────────────────────────────────────────────────────────

type FilterId = 'all' | 'gym' | 'bodyweight' | 'cardio' | 'core' | 'stretch'

const FILTERS: { id: FilterId; label: string; icon: React.ElementType }[] = [
  { id: 'all',        label: 'Todo',        icon: Activity },
  { id: 'gym',        label: 'Gym',         icon: Dumbbell },
  { id: 'bodyweight', label: 'Casa',        icon: Zap },
  { id: 'cardio',     label: 'Cardio',      icon: Activity },
  { id: 'core',       label: 'Core',        icon: Zap },
  { id: 'stretch',    label: 'Estirar',     icon: Activity },
]

function matchesFilter(ex: Exercise, filter: FilterId): boolean {
  if (filter === 'all') return true
  if (filter === 'gym') return ['barbell', 'dumbbell', 'machine', 'cable'].includes(ex.equipment)
  if (filter === 'bodyweight') return ex.equipment === 'bodyweight'
  if (filter === 'cardio') return ex.muscles.some(m => ['gemelos','cuadriceps'].includes(m))
  if (filter === 'core') return ex.muscles.includes('abdominales')
  if (filter === 'stretch') return ex.difficulty <= 2 && ex.equipment === 'bodyweight'
  return true
}

// ── Muscle color map ───────────────────────────────────────────────────────

const MUSCLE_COLORS: Record<string, string> = {
  pecho:         '#FF6B1A',
  espalda:       '#60A5FA',
  hombros:       '#A78BFA',
  biceps:        '#34D399',
  triceps:       '#FB923C',
  cuadriceps:    '#C084FC',
  isquiotibiales:'#F472B6',
  gluteos:       '#FBBF24',
  abdominales:   '#F87171',
  gemelos:       '#4ADE80',
  antebrazos:    '#38BDF8',
  trapecio:      '#818CF8',
}

function getExerciseColor(ex: Exercise): string {
  return MUSCLE_COLORS[ex.muscles[0]] ?? '#60A5FA'
}

// ── Difficulty dots ────────────────────────────────────────────────────────
function DiffDots({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-[3px]">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
          style={{ backgroundColor: i <= level ? color : 'rgba(255,255,255,0.15)' }} />
      ))}
    </div>
  )
}

// ── Equipment badge ───────────────────────────────────────────────────────
const EQ_LABEL: Record<string, string> = {
  barbell: 'Barra', dumbbell: 'Mancuerna', machine: 'Máquina',
  bodyweight: 'Cuerpo', cable: 'Polea', band: 'Banda',
}

// ── Exercise card ─────────────────────────────────────────────────────────

function ExerciseCard({
  exercise, selected, onToggle, delay = 0,
}: { exercise: Exercise; selected: boolean; onToggle: () => void; delay?: number }) {
  const color = getExerciseColor(exercise)
  const animType = getAnimType(exercise.id, exercise.muscles)

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeOut' }}
      onClick={onToggle}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl relative overflow-hidden transition-all"
      style={{
        background: selected
          ? `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`
          : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${selected ? color + '66' : 'rgba(255,255,255,0.07)'}`,
      }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Glow when selected */}
      {selected && (
        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ boxShadow: `inset 0 0 20px ${color}22` }} />
      )}

      {/* Animation box */}
      <div className="relative flex-shrink-0 rounded-xl flex items-center justify-center"
        style={{
          width: 64, height: 64,
          background: `linear-gradient(135deg, ${color}22, ${color}11)`,
          border: `1px solid ${color}33`,
        }}
      >
        <ExerciseAnimation exerciseId={exercise.id} muscles={exercise.muscles}
          animType={animType} color={color} size={52} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight" style={{ color: 'rgba(245,245,240,0.95)' }}>
          {exercise.name}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(245,245,240,0.45)' }}>
          {exercise.muscles.slice(0,2).join(' · ')}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: color + '22', color }}>
            {EQ_LABEL[exercise.equipment] ?? exercise.equipment}
          </span>
          <DiffDots level={exercise.difficulty} color={color} />
        </div>
      </div>

      {/* Check */}
      <motion.div
        animate={{ scale: selected ? 1 : 0.5, opacity: selected ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}88` }}
      >
        <Check size={14} className="text-white" strokeWidth={3} />
      </motion.div>
    </motion.button>
  )
}

// ── Main ExercisePicker ────────────────────────────────────────────────────

export interface ExercisePickerProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (exercises: Exercise[]) => void
  initialSelected?: string[]
  multiSelect?: boolean
  title?: string
}

export function ExercisePicker({
  isOpen, onClose, onConfirm,
  initialSelected = [],
  multiSelect = true,
  title = 'Agregar Ejercicio',
}: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(initialSelected))
      setSearch('')
      setFilter('all')
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen])

  // Reset scroll when filter/search changes
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [filter, search])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return EXERCISES.filter(ex => {
      if (!matchesFilter(ex, filter)) return false
      if (!q) return true
      return ex.name.toLowerCase().includes(q) ||
        ex.muscles.some(m => m.includes(q)) ||
        EQ_LABEL[ex.equipment]?.toLowerCase().includes(q)
    })
  }, [search, filter])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) }
      else if (multiSelect) { next.add(id) }
      else { next.clear(); next.add(id) }
      return next
    })
  }

  function handleConfirm() {
    const chosen = EXERCISES.filter(e => selected.has(e.id))
    onConfirm(chosen)
    onClose()
  }

  const selectedCount = selected.size

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-w-lg mx-auto"
            style={{
              height: '92dvh',
              background: 'linear-gradient(180deg, #1a1a22 0%, #16161e 100%)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'rgba(245,245,240,0.96)' }}>{title}</h2>
                <p className="text-xs" style={{ color: 'rgba(245,245,240,0.4)' }}>
                  {filtered.length} ejercicios disponibles
                </p>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <X size={18} style={{ color: 'rgba(245,245,240,0.7)' }} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-3 px-4 h-11 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
                <Search size={16} style={{ color: 'rgba(245,245,240,0.35)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar ejercicio o músculo..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'rgba(245,245,240,0.9)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X size={14} style={{ color: 'rgba(245,245,240,0.4)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map(f => {
                const active = filter === f.id
                return (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className="flex-shrink-0 px-4 h-8 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, #FF6B1A, #FFA052)'
                        : 'rgba(255,255,255,0.06)',
                      color: active ? '#fff' : 'rgba(245,245,240,0.5)',
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: active ? '0 4px 12px rgba(255,107,26,0.4)' : 'none',
                    }}>
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2"
              style={{ scrollbarWidth: 'none' }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Search size={24} style={{ color: 'rgba(245,245,240,0.2)' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(245,245,240,0.3)' }}>
                    Sin resultados para "{search}"
                  </p>
                </div>
              ) : (
                filtered.map((ex, i) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    selected={selected.has(ex.id)}
                    onToggle={() => toggle(ex.id)}
                    delay={Math.min(i * 0.03, 0.2)}
                  />
                ))
              )}
            </div>

            {/* Bottom CTA */}
            <div className="px-4 pb-6 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              <motion.button
                onClick={selectedCount > 0 ? handleConfirm : undefined}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-base"
                style={{
                  background: selectedCount > 0
                    ? 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)'
                    : 'rgba(255,255,255,0.06)',
                  color: selectedCount > 0 ? '#fff' : 'rgba(245,245,240,0.3)',
                  boxShadow: selectedCount > 0 ? '0 8px 24px rgba(255,107,26,0.45)' : 'none',
                }}
                animate={{ scale: selectedCount > 0 ? 1 : 0.98, opacity: selectedCount > 0 ? 1 : 0.6 }}
                whileTap={selectedCount > 0 ? { scale: 0.97 } : undefined}
              >
                {selectedCount > 0 ? (
                  <>
                    <Check size={18} strokeWidth={2.5} />
                    Agregar {selectedCount} ejercicio{selectedCount > 1 ? 's' : ''}
                    <ChevronRight size={18} />
                  </>
                ) : (
                  'Selecciona un ejercicio'
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
