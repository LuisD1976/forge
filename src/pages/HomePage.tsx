import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Play, ChevronRight, Zap, TrendingUp, Dumbbell, Clock } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useRanksStore } from '../store/ranksStore'
import { RANK_DATA } from '../data/ranks'
import { EXERCISES } from '../data/exercises'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface HomePageProps {
  onStartWorkout: (routineId: string) => void
  onNavigate: (tab: string) => void
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function getTodayExercise() {
  const dayIdx = new Date().getDay()
  const picks = ['bench_press', 'squat', 'barbell_row', 'deadlift', 'overhead_press', 'pull_up', 'hip_thrust']
  return EXERCISES.find((e) => e.id === picks[dayIdx]) ?? EXERCISES[0]
}

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    let raf: number
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

const ProgressRing = ({
  progress, color, size = 56, strokeWidth = 4,
}: { progress: number; color: string; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
        style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}
      />
    </svg>
  )
}

const CATEGORY_COLORS: Record<string, string> = {
  push: '#FF6B1A',
  pull: '#67E8F9',
  legs: '#4ADE80',
  fullbody: '#A855F7',
  hiit: '#EF4444',
  custom: '#FFA052',
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-1.5 rounded-xl border text-xs font-mono" style={{ backgroundColor: '#1A1A23', borderColor: '#32323F', color: '#F0F0EC' }}>
      <span className="font-bold" style={{ color: '#FF6B1A' }}>{Number(payload[0].value).toLocaleString()} kg</span>
    </div>
  )
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } },
}

export const HomePage: React.FC<HomePageProps> = ({ onStartWorkout, onNavigate }) => {
  const { user } = useUserStore()
  const { routines, sessions, weeklyVolume } = useWorkoutStore()
  const { muscleRanks, totalXP, getOverallTier } = useRanksStore()

  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const recentSessions = sessions.slice(0, 3)
  const totalVolumeKg = sessions.reduce((t, s) => t + s.totalVolume, 0)
  const todayExercise = getTodayExercise()

  const dayRoutines = [
    routines.find((r) => r.category === 'push'),
    routines.find((r) => r.category === 'pull'),
    routines.find((r) => r.category === 'legs'),
  ].filter(Boolean)
  const suggestedRoutine = dayRoutines[new Date().getDay() % Math.max(dayRoutines.length, 1)]

  const workoutsThisWeek = weeklyVolume.filter((d) => d.volume > 0).length
  const weeklyGoal = 4
  const weeklyProgress = Math.min((workoutsThisWeek / weeklyGoal) * 100, 100)

  const animXP = useAnimatedCounter(totalXP)
  const animSessions = useAnimatedCounter(sessions.length)
  const animVolume = useAnimatedCounter(Math.round(totalVolumeKg / 1000))

  const maxVolume = Math.max(...weeklyVolume.map((d) => d.volume), 1)
  const totalWeekKg = weeklyVolume.reduce((t, d) => t + d.volume, 0)

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="flex flex-col gap-5 pb-28">

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4 pt-12">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide" style={{ color: 'rgba(240,240,236,0.4)' }}>{greeting()}</p>
            <h1
              className="font-display text-5xl leading-none mt-0.5"
              style={{ background: 'linear-gradient(135deg, #F0F0EC 0%, #FF6B1A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {user?.displayName?.split(' ')[0] ?? 'Forjador'}
            </h1>
            <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'rgba(240,240,236,0.25)' }}>
              {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Streak badge */}
          <motion.div
            whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-2xl border relative overflow-hidden"
            style={{ backgroundColor: 'rgba(255,107,26,0.1)', borderColor: 'rgba(255,107,26,0.3)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,107,26,0.18) 0%, transparent 70%)' }} />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
            >
              <Flame size={18} className="text-forge-orange" style={{ filter: 'drop-shadow(0 0 6px #FF6B1A)' }} />
            </motion.div>
            <span className="font-display text-2xl leading-none text-forge-white">{user?.streak ?? 0}</span>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(240,240,236,0.35)' }}>días</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ── TODAY'S WORKOUT HERO ───────────────────────── */}
      {suggestedRoutine && (
        <motion.div variants={stagger.item} className="mx-4">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer"
            style={{ minHeight: 200 }}
            onClick={() => onStartWorkout(suggestedRoutine.id)}
          >
            <img src={todayExercise.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(8,8,14,0.92) 0%, rgba(8,8,14,0.6) 55%, rgba(8,8,14,0.25) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(255,107,26,0.22) 0%, transparent 55%)' }} />
            {/* shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,107,26,0.7), transparent)' }} />

            <div className="relative p-6 flex flex-col justify-between" style={{ minHeight: 200 }}>
              <div className="flex items-center justify-between">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: 'rgba(255,107,26,0.18)', color: '#FF6B1A', border: '1px solid rgba(255,107,26,0.3)' }}
                >
                  <Zap size={10} />
                  Entrenamiento de hoy
                </div>
                <span className="text-xs font-mono" style={{ color: 'rgba(240,240,236,0.4)' }}>
                  ~{Math.round(suggestedRoutine.exercises.length * 4.5)}min
                </span>
              </div>

              <div className="mt-4">
                <h2 className="font-display text-4xl text-white leading-none mb-1">{suggestedRoutine.name}</h2>
                <p className="text-sm mb-5" style={{ color: 'rgba(240,240,236,0.45)' }}>
                  {suggestedRoutine.exercises.length} ejercicios · {suggestedRoutine.frequency ?? 'Hoy'}
                </p>
                <motion.div
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 6px 24px rgba(255,107,26,0.5), 0 2px 8px rgba(255,107,26,0.3)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Play size={14} fill="white" />
                  Empezar ahora
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── RANK + STATS ────────────────────────────────── */}
      <motion.div variants={stagger.item} className="mx-4">
        <div
          className="rounded-3xl p-5 relative overflow-hidden border"
          style={{ backgroundColor: '#13131A', borderColor: `${overallRank.color}28` }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 50% at 95% 10%, ${overallRank.color}12, transparent)` }} />

          <div className="flex items-center gap-4 relative">
            {/* Rank icon with pulse glow */}
            <motion.div
              animate={{ boxShadow: [`0 0 0px ${overallRank.color}00`, `0 0 24px ${overallRank.color}55`, `0 0 8px ${overallRank.color}18`] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 flex-shrink-0"
              style={{ backgroundColor: overallRank.bgColor, borderColor: overallRank.color }}
            >
              {overallRank.icon}
            </motion.div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(240,240,236,0.35)' }}>Rango Global</p>
              <h2
                className="font-display text-3xl leading-tight"
                style={{ color: overallRank.color, textShadow: `0 0 30px ${overallRank.color}45` }}
              >
                {overallRank.label.toUpperCase()}
              </h2>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(240,240,236,0.28)' }}>{animXP.toLocaleString()} XP</p>
            </div>

            {/* Weekly ring */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="relative">
                <ProgressRing progress={weeklyProgress} color={overallRank.color} size={56} strokeWidth={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold font-mono text-forge-white">{workoutsThisWeek}/{weeklyGoal}</span>
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(240,240,236,0.28)' }}>semana</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Entrenos', value: animSessions.toString(), Icon: Dumbbell },
              { label: 'Volumen', value: `${animVolume}t`, Icon: TrendingUp },
              { label: 'Racha', value: `${user?.streak ?? 0}d`, Icon: Flame },
            ].map((stat, i) => (
              <div key={stat.label} className="flex-1 text-center relative">
                {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />}
                <div className="flex justify-center mb-1">
                  <stat.Icon size={12} style={{ color: 'rgba(240,240,236,0.28)' }} />
                </div>
                <div className="font-display text-2xl text-forge-white">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(240,240,236,0.28)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── WEEKLY VOLUME CHART ──────────────────────────── */}
      <motion.div variants={stagger.item} className="mx-4">
        <div className="rounded-3xl p-4 border" style={{ backgroundColor: '#13131A', borderColor: '#252530' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-forge-white text-sm">Volumen semanal</h3>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(240,240,236,0.28)' }}>
                {totalWeekKg.toLocaleString()} kg esta semana
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF6B1A' }} />
              <span className="text-[11px]" style={{ color: 'rgba(240,240,236,0.28)' }}>kg</span>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolume} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFA052" />
                    <stop offset="100%" stopColor="#FF6B1A" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'rgba(240,240,236,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 } as object} />
                <Bar dataKey="volume" radius={[6, 6, 2, 2]}>
                  {weeklyVolume.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.volume === maxVolume && entry.volume > 0
                          ? 'url(#barGradActive)'
                          : entry.volume > 0
                          ? 'rgba(255,107,26,0.35)'
                          : '#252530'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── MUSCLE RANKS ─────────────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-forge-white">Rangos musculares</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('ranks')}
            className="text-forge-orange text-sm flex items-center gap-1 font-medium"
          >
            Ver todos <ChevronRight size={14} />
          </motion.button>
        </div>
        <div className="flex flex-col gap-2.5">
          {muscleRanks.slice(0, 5).map((rank, idx) => {
            const rankData = RANK_DATA[rank.tier]
            return (
              <motion.div
                key={rank.muscle}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.06 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                style={{ backgroundColor: '#13131A', borderColor: '#252530' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base border flex-shrink-0"
                  style={{ backgroundColor: rankData.bgColor, color: rankData.color, borderColor: `${rankData.color}20` }}
                >
                  {rankData.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-forge-white capitalize">{rank.muscle}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: rankData.color }}>{rankData.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#252530' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${rankData.color}70, ${rankData.color})`,
                        boxShadow: `0 0 8px ${rankData.color}35`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${rank.percentile}%` }}
                      transition={{ duration: 0.9, delay: 0.4 + idx * 0.07, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono w-9 text-right flex-shrink-0" style={{ color: 'rgba(240,240,236,0.3)' }}>
                  {Math.round(rank.percentile)}%
                </span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── QUICK START ROUTINES ─────────────────────────── */}
      <motion.div variants={stagger.item} className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-forge-white">Rutinas rápidas</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('add')}
            className="text-forge-orange text-sm flex items-center gap-1 font-medium"
          >
            Ver todas <ChevronRight size={14} />
          </motion.button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {routines.slice(0, 6).map((routine) => {
            const color = CATEGORY_COLORS[routine.category] ?? '#FF6B1A'
            return (
              <motion.button
                key={routine.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStartWorkout(routine.id)}
                className="flex-shrink-0 snap-start w-44 rounded-2xl p-4 text-left border relative overflow-hidden"
                style={{ backgroundColor: '#13131A', borderColor: `${color}18` }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10" style={{ background: `radial-gradient(circle at 100% 0%, ${color}, transparent)` }} />
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 border"
                  style={{ backgroundColor: `${color}12`, color, borderColor: `${color}20` }}
                >
                  <Play size={14} fill={color} />
                </div>
                <div className="font-semibold text-forge-white text-sm leading-tight mb-1 truncate">{routine.name}</div>
                <div className="flex items-center gap-2 text-xs mb-2.5" style={{ color: 'rgba(240,240,236,0.28)' }}>
                  <span>{routine.exercises.length} ejerc.</span>
                  <span>·</span>
                  <span>{Math.round(routine.exercises.length * 4.5)}min</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, d) => (
                    <div key={d} className="h-1 flex-1 rounded-full" style={{ backgroundColor: d < routine.difficulty ? color : '#252530' }} />
                  ))}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* ── RECENT SESSIONS ──────────────────────────────── */}
      {recentSessions.length > 0 && (
        <motion.div variants={stagger.item} className="px-4">
          <h3 className="font-semibold text-forge-white mb-3">Últimos entrenos</h3>
          <div className="flex flex-col gap-2.5">
            {recentSessions.map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.06 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border"
                style={{ backgroundColor: '#13131A', borderColor: '#252530' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,107,26,0.1)' }}>
                  <Clock size={15} className="text-forge-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-forge-white text-sm truncate">{session.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(240,240,236,0.28)' }}>
                    {new Date(session.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {session.duration}min · {(session.totalVolume / 1000).toFixed(1)}t
                  </div>
                </div>
                <div className="text-sm font-bold font-mono flex-shrink-0" style={{ color: '#FF6B1A' }}>
                  +{session.xpGained} XP
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  )
}

export default HomePage
