import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, Minus } from 'lucide-react'
import type { SetEntry } from '../types'
import { estimateOneRM } from '../utils/rankCalculator'

interface SetLoggerProps {
  sets: SetEntry[]
  exerciseIndex: number
  onUpdateSet: (exerciseIndex: number, setIndex: number, updates: Partial<SetEntry>) => void
  onToggleComplete: (exerciseIndex: number, setIndex: number) => void
  onAddSet: (exerciseIndex: number) => void
}

function rpeColor(rpe: number) {
  if (rpe >= 10) return '#EF4444'
  if (rpe >= 8) return '#F97316'
  if (rpe >= 6) return '#EAB308'
  return '#4ADE80'
}

export const SetLogger: React.FC<SetLoggerProps> = ({
  sets,
  exerciseIndex,
  onUpdateSet,
  onToggleComplete,
  onAddSet,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[36px_1fr_1fr_36px_44px] gap-1.5 px-1 mb-1">
        <span className="text-xs text-forge-white/40 text-center">Set</span>
        <span className="text-xs text-forge-white/40 text-center">Peso (kg)</span>
        <span className="text-xs text-forge-white/40 text-center">Reps</span>
        <span className="text-xs text-forge-white/40 text-center">RPE</span>
        <span className="text-xs text-forge-white/40 text-center">OK</span>
      </div>

      <AnimatePresence>
        {sets.map((set, setIndex) => {
          const oneRM = set.weight > 0 && set.reps > 0
            ? estimateOneRM(set.weight, set.reps)
            : null

          return (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex flex-col gap-1 px-1 py-2 rounded-xl transition-colors ${
                set.completed ? 'bg-forge-green/10 border border-forge-green/20' : 'bg-forge-border/30'
              }`}
            >
              <div className="grid grid-cols-[36px_1fr_1fr_36px_44px] gap-1.5 items-center">
                {/* Set number */}
                <span className="text-center font-mono text-sm text-forge-white/60">{setIndex + 1}</span>

                {/* Weight */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdateSet(exerciseIndex, setIndex, { weight: Math.max(0, set.weight - 2.5) })}
                    className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="font-mono font-bold text-forge-white w-10 text-center text-sm">{set.weight}</span>
                  <button
                    onClick={() => onUpdateSet(exerciseIndex, setIndex, { weight: set.weight + 2.5 })}
                    className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                {/* Reps */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdateSet(exerciseIndex, setIndex, { reps: Math.max(0, set.reps - 1) })}
                    className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="font-mono font-bold text-forge-white w-8 text-center text-sm">{set.reps}</span>
                  <button
                    onClick={() => onUpdateSet(exerciseIndex, setIndex, { reps: set.reps + 1 })}
                    className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                {/* RPE stepper */}
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={() => onUpdateSet(exerciseIndex, setIndex, { rpe: Math.min(10, (set.rpe ?? 7) + 1) })}
                    className="text-forge-white/30 text-[10px] leading-none px-1 active:scale-90"
                  >▲</button>
                  <span
                    className="text-xs font-bold"
                    style={{ color: set.rpe ? rpeColor(set.rpe) : 'rgba(255,255,255,0.3)' }}
                  >
                    {set.rpe ?? '—'}
                  </span>
                  <button
                    onClick={() => onUpdateSet(exerciseIndex, setIndex, { rpe: Math.max(1, (set.rpe ?? 7) - 1) })}
                    className="text-forge-white/30 text-[10px] leading-none px-1 active:scale-90"
                  >▼</button>
                </div>

                {/* OK button */}
                <button
                  onClick={() => onToggleComplete(exerciseIndex, setIndex)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all active:scale-90 ${
                    set.completed
                      ? 'bg-forge-green text-white'
                      : 'bg-forge-border border border-forge-border text-forge-white/40'
                  }`}
                >
                  <Check size={16} />
                </button>
              </div>

              {/* 1RM badge */}
              {oneRM !== null && (
                <div className="pl-10 flex items-center gap-1">
                  <span className="text-[10px] text-forge-orange/80 font-mono">
                    ≈ {oneRM.toFixed(0)} kg 1RM
                  </span>
                  {set.rpe && (
                    <span className="text-[10px]" style={{ color: rpeColor(set.rpe) }}>
                      · RPE {set.rpe}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      <button
        onClick={() => onAddSet(exerciseIndex)}
        className="flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-forge-border text-forge-white/50 hover:text-forge-orange hover:border-forge-orange transition-colors text-sm"
      >
        <Plus size={14} />
        Añadir serie
      </button>
    </div>
  )
}

export default SetLogger
