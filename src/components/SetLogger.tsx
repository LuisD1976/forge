import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, Minus } from 'lucide-react'
import type { SetEntry } from '../types'

interface SetLoggerProps {
  sets: SetEntry[]
  exerciseIndex: number
  onUpdateSet: (exerciseIndex: number, setIndex: number, updates: Partial<SetEntry>) => void
  onToggleComplete: (exerciseIndex: number, setIndex: number) => void
  onAddSet: (exerciseIndex: number) => void
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
      <div className="grid grid-cols-[40px_1fr_1fr_48px] gap-2 px-2 mb-1">
        <span className="text-xs text-forge-white/40 text-center">Set</span>
        <span className="text-xs text-forge-white/40 text-center">Peso (kg)</span>
        <span className="text-xs text-forge-white/40 text-center">Reps</span>
        <span className="text-xs text-forge-white/40 text-center">OK</span>
      </div>

      <AnimatePresence>
        {sets.map((set, setIndex) => (
          <motion.div
            key={set.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`grid grid-cols-[40px_1fr_1fr_48px] gap-2 items-center px-2 py-2 rounded-xl transition-colors ${
              set.completed ? 'bg-forge-green/10 border border-forge-green/20' : 'bg-forge-border/30'
            }`}
          >
            <span className="text-center font-mono text-sm text-forge-white/60">{setIndex + 1}</span>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => onUpdateSet(exerciseIndex, setIndex, { weight: Math.max(0, set.weight - 2.5) })}
                className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
              >
                <Minus size={10} />
              </button>
              <span className="font-mono font-bold text-forge-white w-12 text-center">{set.weight}</span>
              <button
                onClick={() => onUpdateSet(exerciseIndex, setIndex, { weight: set.weight + 2.5 })}
                className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
              >
                <Plus size={10} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => onUpdateSet(exerciseIndex, setIndex, { reps: Math.max(0, set.reps - 1) })}
                className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
              >
                <Minus size={10} />
              </button>
              <span className="font-mono font-bold text-forge-white w-8 text-center">{set.reps}</span>
              <button
                onClick={() => onUpdateSet(exerciseIndex, setIndex, { reps: set.reps + 1 })}
                className="w-6 h-6 rounded bg-forge-border/50 flex items-center justify-center text-forge-white/60 active:scale-90"
              >
                <Plus size={10} />
              </button>
            </div>

            <button
              onClick={() => onToggleComplete(exerciseIndex, setIndex)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all active:scale-90 ${
                set.completed
                  ? 'bg-forge-green text-white'
                  : 'bg-forge-border border border-forge-border text-forge-white/40'
              }`}
            >
              <Check size={18} />
            </button>
          </motion.div>
        ))}
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
