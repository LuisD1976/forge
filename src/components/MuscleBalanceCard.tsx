import { AlertTriangle } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { EXERCISES } from '../data/exercises'

const MUSCLE_GROUPS: { label: string; muscles: string[]; color: string }[] = [
  { label: 'Pecho', muscles: ['pecho'], color: '#EF4444' },
  { label: 'Espalda', muscles: ['espalda'], color: '#3B82F6' },
  { label: 'Hombros', muscles: ['hombros'], color: '#8B5CF6' },
  { label: 'Bíceps', muscles: ['biceps'], color: '#06B6D4' },
  { label: 'Tríceps', muscles: ['triceps'], color: '#F97316' },
  { label: 'Cuádriceps', muscles: ['cuadriceps'], color: '#10B981' },
  { label: 'Isquios', muscles: ['isquiotibiales'], color: '#6EE7B7' },
  { label: 'Glúteos', muscles: ['gluteos'], color: '#EC4899' },
]

export function MuscleBalanceCard() {
  const { sessions } = useWorkoutStore()

  const weekAgo = Date.now() - 7 * 86400000
  const weekSessions = sessions.filter((s) => new Date(s.date).getTime() >= weekAgo)

  const setsByMuscle: Record<string, number> = {}
  for (const session of weekSessions) {
    for (const ex of session.exercises) {
      const exercise = EXERCISES.find((e) => e.id === ex.exerciseId)
      if (!exercise) continue
      const completedSets = ex.sets.filter((s) => s.completed).length
      for (const muscle of exercise.muscles) {
        setsByMuscle[muscle] = (setsByMuscle[muscle] ?? 0) + completedSets
      }
    }
  }

  const maxSets = Math.max(...MUSCLE_GROUPS.map((g) => g.muscles.reduce((t, m) => t + (setsByMuscle[m] ?? 0), 0)), 1)

  // Imbalance detection: push (chest+shoulders+triceps) vs pull (back+biceps)
  const pushSets = (setsByMuscle['pecho'] ?? 0) + (setsByMuscle['hombros'] ?? 0) + (setsByMuscle['triceps'] ?? 0)
  const pullSets = (setsByMuscle['espalda'] ?? 0) + (setsByMuscle['biceps'] ?? 0)
  const hasImbalance = pullSets > 0 && pushSets > 0 && (pushSets / pullSets > 2 || pullSets / pushSets > 2)

  if (weekSessions.length === 0) return null

  return (
    <div className="card-metal p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-forge-white text-sm">Volumen esta semana</h3>
        {hasImbalance && (
          <div className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold">
            <AlertTriangle size={12} />
            Desbalance push/pull
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {MUSCLE_GROUPS.map((group) => {
          const sets = group.muscles.reduce((t, m) => t + (setsByMuscle[m] ?? 0), 0)
          const pct = (sets / maxSets) * 100
          return (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-[10px] text-forge-white/50 w-16 flex-shrink-0">{group.label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: group.color }}
                />
              </div>
              <span className="text-[10px] font-mono text-forge-white/40 w-6 text-right">{sets}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-forge-white/25 mt-2">Series completadas por grupo muscular</p>
    </div>
  )
}
