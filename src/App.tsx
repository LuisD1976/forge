import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import { useUserStore } from './store/userStore'
import { useWorkoutStore } from './store/workoutStore'
import { BottomNav } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { InstallPrompt } from './components/InstallPrompt'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomePage } from './pages/HomePage'
import { RanksPage } from './pages/RanksPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { FriendsPage } from './pages/FriendsPage'
import { ProfilePage } from './pages/ProfilePage'
import { PricingPage } from './pages/PricingPage'
import { AICoachPage } from './pages/AICoachPage'
import { BodyStatsPage } from './pages/BodyStatsPage'
import { HistoryPage } from './pages/HistoryPage'
import type { NavTab } from './types'
import { useRanksStore } from './store/ranksStore'
import { RANK_DATA } from './data/ranks'

function useIsDesktop() {
  const [is, setIs] = useState(window.innerWidth >= 1024)
  useEffect(() => {
    const h = () => setIs(window.innerWidth >= 1024)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return is
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const WELCOME_PHRASES = [
  'La constancia vence al talento siempre.',
  'Cada repetición te acerca a tu mejor versión.',
  'Tu única competencia eres tú de ayer.',
  'El dolor de hoy es la fuerza de mañana.',
  'Hoy decides quién quieres ser mañana.',
  'Los campeones entrenan incluso cuando no quieren.',
  'No pares cuando te duela. Para cuando termines.',
  'La disciplina supera a la motivación, siempre.',
  'Un entreno malo sigue siendo mejor que ninguno.',
  'Forja tu cuerpo, forja tu mente.',
]

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function WelcomeBackScreen({ onEnter }: { onEnter: () => void }) {
  const { user } = useUserStore()
  const { getOverallTier, totalXP } = useRanksStore()
  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const phrase = useMemo(() => WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)], [])
  const firstName = user?.displayName?.split(' ')[0] ?? 'Atleta'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1f0900 0%, #0D0D0F 55%)' }}
    >
      {/* Glow de fondo */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 480, height: 480, top: -160, left: -80,
          background: 'radial-gradient(circle, rgba(255,107,26,0.18) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.1 }}
        className="flex flex-col items-center text-center gap-7 relative z-10 w-full max-w-sm"
      >
        {/* Rango */}
        <motion.div
          animate={{ boxShadow: [`0 0 30px ${overallRank.color}30`, `0 0 60px ${overallRank.color}60`, `0 0 30px ${overallRank.color}30`] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl border-2"
          style={{ backgroundColor: overallRank.bgColor, borderColor: overallRank.color }}
        >
          {overallRank.icon}
        </motion.div>

        {/* Saludo */}
        <div>
          <p className="text-forge-white/40 text-sm font-medium mb-1">{timeGreeting()} ·&nbsp;de vuelta en la forja</p>
          <h1 className="font-display leading-none mb-3" style={{ fontSize: 52, background: 'linear-gradient(135deg, #F0F0EC 0%, #FF6B1A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {firstName}
          </h1>
          <p className="text-forge-white/35 text-sm italic px-4">"{phrase}"</p>
        </div>

        {/* Stats */}
        <div className="flex gap-3 w-full">
          <div className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: '#13131A', border: '1px solid #252530' }}>
            <div className="font-display text-2xl text-forge-orange">{user?.streak ?? 0}🔥</div>
            <div className="text-[10px] text-forge-white/35 mt-0.5">Racha</div>
          </div>
          <div className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: '#13131A', border: '1px solid #252530' }}>
            <div className="font-display text-xl font-bold" style={{ color: overallRank.color }}>{overallRank.label}</div>
            <div className="text-[10px] text-forge-white/35 mt-0.5">Rango global</div>
          </div>
          <div className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: '#13131A', border: '1px solid #252530' }}>
            <div className="font-display text-xl text-forge-white">{(totalXP / 1000).toFixed(1)}k</div>
            <div className="text-[10px] text-forge-white/35 mt-0.5">XP total</div>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onEnter}
          className="w-full py-4 rounded-2xl font-display text-2xl text-white tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)',
            boxShadow: '0 8px 40px rgba(255,107,26,0.55)',
          }}
        >
          FORJAR HOY ⚡
        </motion.button>

        <p className="text-forge-white/20 text-xs">{user?.totalWorkouts ?? 0} entrenos completados en total</p>
      </motion.div>
    </motion.div>
  )
}

function RightPanel() {
  const { user } = useUserStore()
  const { sessions } = useWorkoutStore()
  const { muscleRanks, getOverallTier, totalXP } = useRanksStore()
  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]
  const topMuscles = [...muscleRanks].sort((a, b) => b.percentile - a.percentile).slice(0, 5)

  return (
    <aside className="w-72 shrink-0 sticky top-0 h-screen overflow-y-auto py-6 px-4 flex flex-col gap-4 border-l border-forge-border">
      <div className="card-metal p-4">
        <p className="text-xs text-forge-white/40 uppercase tracking-wider mb-2">Tu rango global</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2"
            style={{ backgroundColor: overallRank.bgColor, borderColor: overallRank.color, boxShadow: `0 0 16px ${overallRank.color}30` }}>
            {overallRank.icon}
          </div>
          <div>
            <div className="font-display text-xl" style={{ color: overallRank.color }}>{overallRank.label.toUpperCase()}</div>
            <div className="text-xs text-forge-white/40">{totalXP.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      <div className="card-metal p-4">
        <p className="text-xs text-forge-white/40 uppercase tracking-wider mb-3">Esta semana</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-forge-black rounded-xl p-2.5 text-center">
            <div className="font-bold text-forge-white text-lg">{sessions.filter(s => {
              const d = new Date(s.date)
              const now = new Date()
              const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
              return d >= startOfWeek
            }).length}</div>
            <div className="text-xs text-forge-white/40">Entrenos</div>
          </div>
          <div className="bg-forge-black rounded-xl p-2.5 text-center">
            <div className="font-bold text-forge-white text-lg">{user?.streak ?? 0}🔥</div>
            <div className="text-xs text-forge-white/40">Racha</div>
          </div>
        </div>
      </div>

      <div className="card-metal p-4">
        <p className="text-xs text-forge-white/40 uppercase tracking-wider mb-3">Top músculos</p>
        <div className="flex flex-col gap-2">
          {topMuscles.map((rank) => {
            const r = RANK_DATA[rank.tier]
            return (
              <div key={rank.muscle} className="flex items-center gap-2">
                <span style={{ color: r.color }} className="text-sm">{r.icon}</span>
                <span className="text-sm text-forge-white capitalize flex-1">{rank.muscle}</span>
                <span className="text-xs font-semibold" style={{ color: r.color }}>{r.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

function App() {
  const { session, loading: authLoading, profileLoading } = useAuth()
  const { user, isOnboardingComplete } = useUserStore()
  const { activeWorkout } = useWorkoutStore()
  const isDesktop = useIsDesktop()

  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [pendingRoutineId, setPendingRoutineId] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)
  const [showAICoach, setShowAICoach] = useState(false)
  const [showBodyStats, setShowBodyStats] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Pantalla de bienvenida: solo se muestra una vez por sesión del navegador
  // Se activa si el usuario YA tenía onboarding completo al iniciar (usuario existente)
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      const alreadyWelcomed = sessionStorage.getItem('forge-welcomed') === 'true'
      const wasComplete = useUserStore.getState().isOnboardingComplete
      return !alreadyWelcomed && wasComplete
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (activeWorkout && activeTab !== 'add') setActiveTab('add')
  }, [activeWorkout])

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab)
    if (tab !== 'add') setPendingRoutineId(null)
    setShowPricing(false)
    setShowAICoach(false)
    setShowBodyStats(false)
    setShowHistory(false)
  }

  const handleEnterApp = () => {
    try { sessionStorage.setItem('forge-welcomed', 'true') } catch { /* noop */ }
    setShowWelcome(false)
  }

  // ── Loading ──
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-forge-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="font-display text-4xl text-gradient-forge tracking-wider">FORGE</span>
          <Loader2 className="w-6 h-6 text-forge-orange animate-spin" />
        </div>
      </div>
    )
  }

  // ── Sin sesión ──
  if (!session) return <AuthPage />

  // ── Perfil no cargó (error de red) ──
  if (!user) {
    return (
      <div className="min-h-screen bg-forge-black flex flex-col items-center justify-center gap-5 p-8">
        <span className="font-display text-4xl text-gradient-forge tracking-wider">FORGE</span>
        <p className="text-forge-white/40 text-sm text-center">No pudimos cargar tu perfil.<br />Verifica tu conexión.</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    )
  }

  // ── Onboarding (solo usuarios nuevos sin perfil completado) ──
  if (!isOnboardingComplete) return <OnboardingPage />

  // ── Pantalla de bienvenida (usuarios que vuelven) ──
  if (showWelcome) {
    return (
      <AnimatePresence mode="wait">
        <WelcomeBackScreen key="welcome" onEnter={handleEnterApp} />
      </AnimatePresence>
    )
  }

  // ── Modales de página completa ──
  if (showPricing)   return <PricingPage onBack={() => setShowPricing(false)} />
  if (showBodyStats) return <BodyStatsPage onBack={() => setShowBodyStats(false)} />
  if (showHistory)   return <HistoryPage onBack={() => setShowHistory(false)} />
  if (showAICoach)   return (
    <AICoachPage
      onBack={() => setShowAICoach(false)}
      onUpgrade={() => { setShowAICoach(false); setShowPricing(true) }}
    />
  )

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.1 }} className="flex-1 overflow-y-auto">
            <HomePage onStartWorkout={(id) => { setPendingRoutineId(id); setActiveTab('add') }} onNavigate={(t) => handleTabChange(t as NavTab)} />
          </motion.div>
        )
      case 'ranks':
        return (
          <motion.div key="ranks" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.1 }} className="flex-1 overflow-y-auto">
            <RanksPage />
          </motion.div>
        )
      case 'add':
        return (
          <motion.div key="add" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.1 }} className="flex-1 overflow-y-auto">
            <WorkoutPage initialRoutineId={pendingRoutineId} onClose={() => { setPendingRoutineId(null); setActiveTab('home') }} />
          </motion.div>
        )
      case 'friends':
        return (
          <motion.div key="friends" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.1 }} className="flex-1 overflow-y-auto">
            <FriendsPage />
          </motion.div>
        )
      case 'profile':
        return (
          <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.1 }} className="flex-1 overflow-y-auto">
            <ProfilePage onUpgrade={() => setShowPricing(true)} onAICoach={() => setShowAICoach(true)} onBodyStats={() => setShowBodyStats(true)} onHistory={() => setShowHistory(true)} />
          </motion.div>
        )
      default: return null
    }
  }

  if (isDesktop) {
    return (
      <div className="min-h-screen flex">
        <div className="forge-glow-orange w-[500px] h-[500px] -top-32 -left-16 opacity-60" style={{ position: 'fixed' }} />
        <div className="forge-glow-orange w-[400px] h-[400px] bottom-0 right-64 opacity-30" style={{ position: 'fixed', animationDelay: '-8s' }} />
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col min-w-0 max-w-3xl border-r border-forge-border">
          <AnimatePresence mode="popLayout">
            {renderPage()}
          </AnimatePresence>
        </div>
        <RightPanel />
        <InstallPrompt />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto relative">
      <div className="forge-glow-orange w-[350px] h-[350px] -top-24 -left-16 opacity-70" style={{ position: 'fixed' }} />
      <div className="forge-glow-orange w-[280px] h-[280px] bottom-0 right-0 opacity-25" style={{ position: 'fixed', animationDelay: '-10s' }} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <InstallPrompt />
    </div>
  )
}

export default App
