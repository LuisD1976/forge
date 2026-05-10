import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Crown, Flame, TrendingUp, Trophy, ChevronRight,
  LogOut, Star, Shield, Download, Sparkles,
  Camera, Scale, Dumbbell, History, Target,
} from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useRanksStore } from '../store/ranksStore'
import { useBodyStore } from '../store/bodyStore'
import { usePRStore } from '../store/prStore'
import { RANK_DATA } from '../data/ranks'
import { triggerPWAInstall, isPWAInstallable, isPWAInstalled } from '../utils/pwaInstall'
import { useAuth } from '../contexts/AuthContext'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ProfilePageProps {
  onUpgrade?: () => void
  onAICoach?: () => void
  onBodyStats?: () => void
  onHistory?: () => void
}

type Period = '7d' | '30d' | '90d'

export const ProfilePage: React.FC<ProfilePageProps> = ({ onUpgrade, onAICoach, onBodyStats, onHistory }) => {
  const { user, activatePro, reset } = useUserStore()
  const { sessions, weeklyVolume } = useWorkoutStore()
  const { totalXP, getOverallTier, muscleRanks } = useRanksStore()
  const { getLatest } = useBodyStore()
  const { records: prRecords } = usePRStore()
  const { signOut } = useAuth()
  const [showProModal, setShowProModal] = useState(false)
  const [period, setPeriod] = useState<Period>('7d')

  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const totalVolume = sessions.reduce((t, s) => t + s.totalVolume, 0)
  const avgDuration = sessions.length
    ? Math.round(sessions.reduce((t, s) => t + s.duration, 0) / sessions.length)
    : 0

  // Build chart data for different periods
  const chartData = (() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    return Array.from({ length: Math.min(days, 7) }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return weeklyVolume[i] ?? { day: d.toLocaleDateString('es', { weekday: 'short' }), volume: 0 }
    })
  })()

  const topMuscle = [...muscleRanks].sort((a, b) => b.percentile - a.percentile)[0]
  const latestBody = getLatest()
  const topPR = [...prRecords].sort((a, b) => b.oneRM - a.oneRM)[0]

  const handleInstall = async () => { await triggerPWAInstall() }
  const handleSignOut = async () => {
    if (confirm('¿Cerrar sesión?')) { reset(); await signOut() }
  }

  if (!user) return null

  const proFeatures = [
    'Generador de rutinas con FORGE IA',
    'Análisis corporal avanzado',
    'Sugerencias de sobrecarga progresiva',
    'Sin límite de rutinas guardadas',
    'Estadísticas avanzadas',
    'Sin anuncios',
  ]

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-display text-3xl text-gradient-forge">MI PERFIL</h1>
      </div>

      {/* Profile card */}
      <div className="mx-4 mb-4">
        <div
          className="card-metal p-5 relative overflow-hidden"
          style={{ borderColor: user.isPro ? '#FFD70040' : `${overallRank.color}30` }}
        >
          {user.isPro && (
            <div
              className="absolute top-0 right-0 px-3 py-1 flex items-center gap-1 rounded-bl-xl"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA052)' }}
            >
              <Crown size={12} className="text-black" />
              <span className="text-xs font-bold text-black">PRO</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 flex-shrink-0"
              style={{ backgroundColor: overallRank.bgColor, borderColor: overallRank.color, color: overallRank.color }}
            >
              {user.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="font-bold text-forge-white text-lg">{user.displayName}</h2>
              <p className="text-forge-white/50 text-sm">@{user.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold" style={{ color: overallRank.color }}>
                  {overallRank.icon} {overallRank.label}
                </span>
                <span className="text-forge-white/20">·</span>
                <span className="text-xs text-forge-white/40">{totalXP.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-forge-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame size={14} className="text-forge-orange" />
                <span className="font-bold text-forge-white">{user.streak}</span>
              </div>
              <div className="text-xs text-forge-white/40">Racha días</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-forge-white">{sessions.length}</div>
              <div className="text-xs text-forge-white/40">Entrenos</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-forge-white">{(totalVolume / 1000).toFixed(1)}t</div>
              <div className="text-xs text-forge-white/40">Volumen total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume chart */}
      <div className="mx-4 mb-4">
        <div className="card-metal p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-forge-white text-sm">Volumen de entrenamiento</h3>
            <div className="flex gap-1 bg-forge-black rounded-lg p-0.5">
              {(['7d', '30d', '90d'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${period === p ? 'bg-forge-orange text-white' : 'text-forge-white/40'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="profileVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B1A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF6B1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#F5F5F040', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181C', border: '1px solid #2A2A30', borderRadius: '8px', fontSize: '12px', color: '#F5F5F0' }}
                  formatter={(v) => [`${Number(v ?? 0).toLocaleString()} kg`, 'Volumen']}
                />
                <Area type="monotone" dataKey="volume" stroke="#FF6B1A" strokeWidth={2} fill="url(#profileVolumeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2x2 Stats grid */}
      <div className="mx-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Escaneo corporal (PRO) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => !user.isPro && onUpgrade?.()}
            className="card-metal p-4 flex flex-col gap-2 text-left relative overflow-hidden"
          >
            {!user.isPro && (
              <div className="absolute top-2 right-2">
                <Crown size={12} className="text-forge-orange" />
              </div>
            )}
            <Camera size={22} className="text-forge-orange" />
            <div>
              <div className="font-semibold text-forge-white text-sm">Escaneo</div>
              <div className="text-xs text-forge-white/40">{user.isPro ? 'Analiza tu físico' : 'Solo PRO'}</div>
            </div>
          </motion.button>

          {/* Peso corporal */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onBodyStats?.()}
            className="card-metal p-4 flex flex-col gap-2 text-left"
          >
            <Scale size={22} className="text-forge-orange" />
            <div>
              <div className="font-semibold text-forge-white text-sm">Mi cuerpo</div>
              <div className="font-mono text-forge-orange text-lg">
                {latestBody?.weight ? `${latestBody.weight} kg` : user.weight ? `${user.weight} kg` : '— kg'}
              </div>
            </div>
          </motion.button>

          {/* Mejor músculo */}
          <div className="card-metal p-4 flex flex-col gap-2">
            <Dumbbell size={22} className="text-forge-white/50" />
            <div>
              <div className="font-semibold text-forge-white text-sm">Mejor músculo</div>
              {topMuscle && topMuscle.oneRM > 0 ? (
                <div className="text-xs capitalize" style={{ color: RANK_DATA[topMuscle.tier].color }}>
                  {topMuscle.muscle} · {RANK_DATA[topMuscle.tier].label}
                </div>
              ) : (
                <div className="text-xs text-forge-white/40">Registra entrenos</div>
              )}
            </div>
          </div>

          {/* Historial */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onHistory?.()}
            className="card-metal p-4 flex flex-col gap-2 text-left"
          >
            <History size={22} className="text-forge-orange" />
            <div>
              <div className="font-semibold text-forge-white text-sm">Historial</div>
              <div className="text-xs text-forge-white/40">{sessions.length} entrenos</div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* PRO Upgrade or AI Coach */}
      {!user.isPro ? (
        <div className="mx-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpgrade ? onUpgrade() : setShowProModal(true)}
            className="w-full rounded-2xl p-4 flex items-center gap-4 text-left"
            style={{ background: 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)' }}
          >
            <Crown size={28} className="text-white flex-shrink-0" />
            <div>
              <div className="font-bold text-white">Hazte FORGE PRO</div>
              <div className="text-white/80 text-xs">IA, análisis avanzado y rangos completos</div>
            </div>
            <ChevronRight size={20} className="text-white ml-auto" />
          </motion.button>
        </div>
      ) : (
        <div className="mx-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onAICoach?.()}
            className="w-full card-metal p-4 flex items-center gap-4 text-left border-forge-orange/30"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-forge-white">Coach IA</div>
              <div className="text-forge-white/50 text-xs">FORGE IA · Pregunta lo que quieras</div>
            </div>
            <ChevronRight size={18} className="text-forge-orange ml-auto" />
          </motion.button>
        </div>
      )}

      {/* Settings list */}
      <div className="mx-4">
        <div className="card-metal divide-y divide-forge-border">
          {isPWAInstallable() && !isPWAInstalled() && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-forge-border/30 transition-colors"
            >
              <Download size={18} className="text-forge-orange" />
              <span className="flex-1 text-sm text-forge-white">Instalar app en dispositivo</span>
              <ChevronRight size={16} className="text-forge-white/30" />
            </button>
          )}

          <div className="flex items-center gap-3 px-4 py-3.5">
            <Trophy size={18} className="text-forge-white/40" />
            <div className="flex-1">
              <span className="text-sm text-forge-white">Mejor rango global</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: overallRank.color }}>
              {overallRank.icon} {overallRank.label}
            </span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <TrendingUp size={18} className="text-forge-white/40" />
            <div className="flex-1">
              <span className="text-sm text-forge-white">Duración media entreno</span>
            </div>
            <span className="text-sm text-forge-white/60 font-mono">{avgDuration} min</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <Star size={18} className="text-forge-white/40" />
            <div className="flex-1"><span className="text-sm text-forge-white">XP totales</span></div>
            <span className="text-sm text-forge-orange font-bold font-mono">{totalXP.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <Shield size={18} className="text-forge-white/40" />
            <div className="flex-1"><span className="text-sm text-forge-white">Nivel de experiencia</span></div>
            <span className="text-sm text-forge-white/60 capitalize">{user.experience}</span>
          </div>

          {topPR && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Target size={18} className="text-forge-white/40" />
              <div className="flex-1">
                <span className="text-sm text-forge-white">Mejor récord</span>
                <div className="text-xs text-forge-white/30 truncate">{topPR.exerciseName}</div>
              </div>
              <span className="text-sm font-mono font-bold text-forge-orange">{topPR.oneRM.toFixed(0)} kg</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-forge-border/30 transition-colors"
          >
            <LogOut size={18} className="text-forge-white/40" />
            <span className="flex-1 text-sm text-forge-white">Cerrar sesión</span>
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 text-center">
        <p className="text-forge-white/15 text-xs">FORGE v1.0 · Forja tu cuerpo, conquista tus rangos</p>
      </div>

      {/* PRO Modal (fallback) */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowProModal(false)}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-forge-iron rounded-t-3xl p-6 border-t border-forge-border max-h-[80vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-forge-border rounded-full mx-auto mb-6" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA052)' }}>
                <Crown size={24} className="text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-forge-white">FORGE PRO</h3>
                <p className="text-forge-white/50 text-sm">Desbloquea todo el potencial</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              {proFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-forge-white">
                  <div className="w-4 h-4 rounded-full bg-forge-green flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => { activatePro(); setShowProModal(false) }}
              className="w-full py-4 rounded-2xl font-bold text-black text-lg"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FFA052)' }}
            >
              Activar PRO (Demo)
            </button>
            <p className="text-center text-xs text-forge-white/30 mt-2">
              Demo · En producción se integraría Stripe/RevenueCat
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
