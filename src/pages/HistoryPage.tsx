import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronDown, Dumbbell, Clock, TrendingUp, Trophy, Flame } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { EXERCISES } from '../data/exercises'
import type { WorkoutSession } from '../types'

interface HistoryPageProps {
  onBack: () => void
}

type Filter = 'all' | 'push' | 'pull' | 'legs' | 'fullbody'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Pierna' },
  { id: 'fullbody', label: 'Full' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      layout
      className="card-metal overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.2), rgba(255,160,82,0.1))' }}
        >
          <Dumbbell size={18} className="text-forge-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-forge-white text-sm truncate">{session.name}</div>
          <div className="text-xs text-forge-white/40">{formatDate(session.date)}</div>
        </div>
        <div className="text-right mr-2">
          <div className="text-sm font-bold text-forge-orange">+{session.xpGained} XP</div>
          <div className="text-xs text-forge-white/40">{(session.totalVolume / 1000).toFixed(1)}t</div>
        </div>
        <ChevronDown
          size={16}
          className="text-forge-white/30 transition-transform flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-forge-border pt-3">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-forge-black rounded-xl p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-forge-white/60 mb-0.5">
                    <Clock size={11} />
                  </div>
                  <div className="text-sm font-bold text-forge-white">{session.duration}m</div>
                  <div className="text-[10px] text-forge-white/30">Duración</div>
                </div>
                <div className="bg-forge-black rounded-xl p-2 text-center">
                  <div className="text-sm font-bold text-forge-white">{session.exercises.length}</div>
                  <div className="text-[10px] text-forge-white/30">Ejercicios</div>
                </div>
                <div className="bg-forge-black rounded-xl p-2 text-center">
                  <div className="text-sm font-bold text-forge-white">
                    {session.exercises.reduce((t, ex) => t + ex.sets.filter(s => s.completed).length, 0)}
                  </div>
                  <div className="text-[10px] text-forge-white/30">Series</div>
                </div>
              </div>

              {/* Exercises */}
              <div className="flex flex-col gap-1.5">
                {session.exercises.map((ex, i) => {
                  const exercise = EXERCISES.find((e) => e.id === ex.exerciseId)
                  const completed = ex.sets.filter((s) => s.completed)
                  const best = completed.reduce((b, s) => s.weight > b.weight ? s : b, { weight: 0, reps: 0 } as typeof completed[0])
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-forge-white/70 truncate flex-1">{exercise?.name ?? ex.exerciseId}</span>
                      <span className="text-forge-white/40 ml-2 flex-shrink-0">
                        {completed.length} series
                        {best.weight > 0 && <span className="text-forge-orange ml-1">· {best.weight}kg×{best.reps}</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const { sessions } = useWorkoutStore()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return sessions
    return sessions.filter((s) => {
      const name = s.name.toLowerCase()
      if (filter === 'push') return name.includes('push') || name.includes('pecho') || name.includes('empuje')
      if (filter === 'pull') return name.includes('pull') || name.includes('espalda') || name.includes('tirón')
      if (filter === 'legs') return name.includes('leg') || name.includes('pierna') || name.includes('cuadric') || name.includes('glút')
      if (filter === 'fullbody') return name.includes('full') || name.includes('completo') || name.includes('hiit')
      return true
    })
  }, [sessions, filter])

  const totalVolume = sessions.reduce((t, s) => t + s.totalVolume, 0)
  const totalTime = sessions.reduce((t, s) => t + s.duration, 0)
  const totalXP = sessions.reduce((t, s) => t + s.xpGained, 0)

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-forge-white/50 hover:text-forge-white transition-colors p-1">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-display text-3xl text-gradient-forge">HISTORIAL</h1>
          <p className="text-forge-white/40 text-xs">{sessions.length} entrenamientos registrados</p>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="mx-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="card-metal p-3 text-center">
            <Flame size={16} className="text-forge-orange mx-auto mb-1" />
            <div className="font-bold text-forge-white text-lg">{sessions.length}</div>
            <div className="text-[10px] text-forge-white/40">Entrenos</div>
          </div>
          <div className="card-metal p-3 text-center">
            <TrendingUp size={16} className="text-forge-orange mx-auto mb-1" />
            <div className="font-bold text-forge-white text-lg">{(totalVolume / 1000).toFixed(0)}t</div>
            <div className="text-[10px] text-forge-white/40">Volumen</div>
          </div>
          <div className="card-metal p-3 text-center">
            <Trophy size={16} className="text-forge-orange mx-auto mb-1" />
            <div className="font-bold text-forge-white text-lg">{totalXP.toLocaleString()}</div>
            <div className="text-[10px] text-forge-white/40">XP ganados</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.id
                ? 'bg-forge-orange text-white'
                : 'bg-forge-iron border border-forge-border text-forge-white/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sessions */}
      <div className="px-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell size={40} className="text-forge-white/10 mx-auto mb-3" />
            <p className="text-forge-white/30 text-sm">No hay entrenamientos aún</p>
            <p className="text-forge-white/20 text-xs mt-1">Completa tu primer entreno para verlo aquí</p>
          </div>
        ) : (
          filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>

      {totalTime > 0 && (
        <p className="text-center text-forge-white/20 text-xs mt-6 px-4">
          {Math.floor(totalTime / 60)}h {totalTime % 60}m en el gimnasio en total
        </p>
      )}
    </div>
  )
}

export default HistoryPage
