import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
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

function RightPanel() {
  const { user } = useUserStore()
  const { sessions } = useWorkoutStore()
  const { muscleRanks, getOverallTier, totalXP } = useRanksStore()
  const overallTier = getOverallTier()
  const overallRank = RANK_DATA[overallTier]

  const topMuscles = [...muscleRanks].sort((a, b) => b.percentile - a.percentile).slice(0, 5)

  return (
    <aside className="w-72 shrink-0 sticky top-0 h-screen overflow-y-auto py-6 px-4 flex flex-col gap-4 border-l border-forge-border">
      {/* Rank summary */}
      <div className="card-metal p-4">
        <p className="text-xs text-forge-white/40 uppercase tracking-wider mb-2">Tu rango global</p>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2"
            style={{ backgroundColor: overallRank.bgColor, borderColor: overallRank.color, boxShadow: `0 0 16px ${overallRank.color}30` }}
          >
            {overallRank.icon}
          </div>
          <div>
            <div className="font-display text-xl" style={{ color: overallRank.color }}>{overallRank.label.toUpperCase()}</div>
            <div className="text-xs text-forge-white/40">{totalXP.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
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

      {/* Top muscles */}
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

  if (!session) return <AuthPage />

  if (!user) {
    return (
      <div className="min-h-screen bg-forge-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="font-display text-4xl text-gradient-forge tracking-wider">FORGE</span>
          <Loader2 className="w-6 h-6 text-forge-orange animate-spin" />
        </div>
      </div>
    )
  }

  if (!isOnboardingComplete) return <OnboardingPage />

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
        {/* Glows ambientales desktop */}
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
      {/* Glows ambientales móvil */}
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
