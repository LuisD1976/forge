import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Star, Check } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useWorkoutStore } from '../store/workoutStore'
import { useAuth } from '../contexts/AuthContext'
import type { QuestionnaireAnswers, Routine } from '../types'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { generatePersonalizedPlan } from '../utils/claudeAPI'

// ─── Slides ──────────────────────────────────────────────────────────────────

const SLIDES = [
  { id: 1, bg: 'linear-gradient(160deg, #1a0505 0%, #0D0D0F 60%)', accent: '#EF4444', emoji: '😞', title: 'Tu disciplina\nse desvanece', body: 'Empiezas con todo el ánimo, pero al cabo de semanas la rutina se vuelve invisible. Acabas en el sofá, otra vez.' },
  { id: 2, bg: 'linear-gradient(160deg, #1a0808 0%, #0D0D0F 60%)', accent: '#EF4444', emoji: '🤷', title: 'Improvisas\nen el gym', body: 'Llegas sin un plan claro y haces lo primero que encuentras libre. Sin estrategia, no hay progreso real.' },
  { id: 3, bg: 'linear-gradient(160deg, #150505 0%, #0D0D0F 70%)', accent: '#EF4444', emoji: '🪞', title: 'El espejo\nno miente', body: 'Meses de esfuerzo, y al verte en el espejo sigues igual. El problema no es tu cuerpo, es tu sistema.' },
  { id: 4, bg: 'linear-gradient(160deg, #0D0D0F 0%, #0D1A0A 100%)', accent: '#4ADE80', emoji: null, title: 'Cambia\nel método', body: 'Estudios muestran que un plan estructurado multiplica los resultados ×3 en los primeros 90 días.', isChart: true },
  { id: 5, bg: 'linear-gradient(160deg, #2D0A00 0%, #FF6B1A 100%)', accent: '#FFD700', emoji: '🏆', title: 'Convierte el gym\nen un juego', body: 'FORGE transforma cada serie en progreso medible. Rangos, rachas y récords que te enganchan.' },
]

const chartData = [
  { x: 0, forge: 10, sin: 10 }, { x: 1, forge: 20, sin: 12 }, { x: 2, forge: 35, sin: 13 },
  { x: 3, forge: 55, sin: 15 }, { x: 4, forge: 75, sin: 14 }, { x: 5, forge: 100, sin: 16 },
]

function SlideChart() {
  return (
    <div className="w-full px-2">
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="forgeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B1A" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#FF6B1A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7280" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="forge" stroke="#FF6B1A" strokeWidth={2.5} fill="url(#forgeGrad)" dot={false} />
            <Area type="monotone" dataKey="sin" stroke="#6B7280" strokeWidth={1.5} fill="url(#sinGrad)" dot={false} strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-0.5 bg-forge-orange rounded" />
          <span className="text-forge-white/80 font-semibold">Con FORGE</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-0.5 bg-forge-white/30 rounded" />
          <span className="text-forge-white/40">Sin FORGE</span>
        </div>
      </div>
    </div>
  )
}

function EmojiSlide({ slide, onNext }: { slide: typeof SLIDES[0]; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="flex-1 flex flex-col items-center justify-between p-8 pt-16 pb-12"
      style={{ background: slide.bg }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs">
        {slide.emoji && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }} className="text-7xl mb-8">
            {slide.emoji}
          </motion.div>
        )}
        {slide.isChart && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full mb-8">
            <SlideChart />
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-display text-5xl leading-none mb-5 whitespace-pre-line"
          style={{ color: slide.accent === '#EF4444' ? '#F5F5F0' : slide.accent }}
        >
          {slide.title}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-forge-white/60 text-base leading-relaxed">
          {slide.body}
        </motion.p>
      </div>
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        onClick={onNext} whileTap={{ scale: 0.95 }}
        className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
        style={{ background: slide.id === 5 ? 'linear-gradient(135deg, #FFD700, #FFA052)' : 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 24px rgba(255,107,26,0.4)' }}
      >
        {slide.id === 5 ? 'Empezar mi forja' : 'Continuar'} <ChevronRight size={20} />
      </motion.button>
    </motion.div>
  )
}

// ─── Questions ────────────────────────────────────────────────────────────────

interface Option { value: string; label: string; icon: string; desc?: string }

const QUESTIONS = [
  {
    key: 'goal', question: '¿Cuál es tu objetivo principal?', subtitle: 'Diseñaremos tu experiencia a medida',
    options: [
      { value: 'muscle', label: 'Ganar músculo', icon: '💪', desc: 'Hipertrofia y fuerza' },
      { value: 'fat_loss', label: 'Perder grasa', icon: '🔥', desc: 'Definición y cardio' },
      { value: 'strength', label: 'Aumentar fuerza', icon: '⚡', desc: 'Rendimiento máximo' },
      { value: 'health', label: 'Salud general', icon: '❤️', desc: 'Bienestar y longevidad' },
      { value: 'sport', label: 'Deporte específico', icon: '🏅', desc: 'Rendimiento atlético' },
    ] as Option[],
  },
  {
    key: 'motivation', question: '¿Qué te motiva más?', subtitle: 'Así creamos el plan mental perfecto',
    options: [
      { value: 'competition', label: 'Competir', icon: '🥊', desc: 'Superarme y a otros' },
      { value: 'aesthetics', label: 'Estética', icon: '🪞', desc: 'Verme increíble' },
      { value: 'health', label: 'Salud', icon: '🫀', desc: 'Sentirme mejor' },
      { value: 'discipline', label: 'Disciplina', icon: '🧠', desc: 'El proceso importa' },
      { value: 'social', label: 'Social', icon: '👥', desc: 'Entrenar acompañado' },
      { value: 'fun', label: 'Diversión', icon: '🎮', desc: 'Que sea un juego' },
    ] as Option[],
  },
  {
    key: 'experience', question: '¿Cuál es tu nivel de experiencia?', subtitle: 'Sé honesto, te ayudará a progresar más',
    options: [
      { value: 'beginner', label: 'Principiante', icon: '🌱', desc: 'Menos de 1 año' },
      { value: 'intermediate', label: 'Intermedio', icon: '📈', desc: '1-3 años' },
      { value: 'advanced', label: 'Avanzado', icon: '🏆', desc: '3-5 años' },
      { value: 'elite', label: 'Élite', icon: '⭐', desc: 'Más de 5 años' },
    ] as Option[],
  },
  {
    key: 'equipment', question: '¿Dónde entrenas habitualmente?', subtitle: 'Adaptaremos los ejercicios a tu entorno', type: 'card4',
    options: [
      { value: 'gym', label: 'Gimnasio completo', icon: '🏋️', desc: 'Máquinas y pesos libres' },
      { value: 'home_weights', label: 'Casa con pesas', icon: '🏠', desc: 'Mancuernas y barra' },
      { value: 'bodyweight', label: 'Sin equipamiento', icon: '🤸', desc: 'Solo peso corporal' },
      { value: 'outdoor', label: 'Exterior / Calistenia', icon: '🌿', desc: 'Barras y parques' },
    ] as Option[],
  },
  {
    key: 'hasUsedApp', question: '¿Has usado alguna app de fitness antes?', subtitle: '', type: 'yesno',
    options: [
      { value: 'true', label: 'Sí', icon: '✅', desc: 'He probado otras apps' },
      { value: 'false', label: 'No', icon: '🆕', desc: 'Soy nuevo en esto' },
    ] as Option[],
  },
  {
    key: 'phrase', question: '¿Con cuál frase te identificas más?', subtitle: 'Elige la que describe tu actitud', type: 'bubble',
    options: [
      { value: 'no_pain', label: 'Sin dolor no hay gloria', icon: '💥' },
      { value: 'consistency', label: 'La constancia vence al talento', icon: '🔄' },
      { value: 'strong', label: 'Voy a ser la versión más fuerte de mí', icon: '🦾' },
      { value: 'data', label: 'Lo que no se mide no mejora', icon: '📊' },
      { value: 'game', label: 'El gym es mi videojuego', icon: '🎮' },
      { value: 'beast', label: 'Modo bestia activado', icon: '🔥' },
    ] as Option[],
  },
]

// ─── Personal Data ────────────────────────────────────────────────────────────

const INJURY_OPTIONS = [
  { value: 'back', label: 'Espalda', icon: '🔙' },
  { value: 'knee', label: 'Rodilla', icon: '🦵' },
  { value: 'hip', label: 'Cadera', icon: '🩻' },
  { value: 'elbow', label: 'Codo', icon: '💪' },
  { value: 'shoulder', label: 'Hombro', icon: '🏋️' },
  { value: 'wrist', label: 'Muñeca', icon: '✋' },
]

// ─── Generating ───────────────────────────────────────────────────────────────

const GENERATING_MESSAGES = [
  { icon: '🧬', text: 'Analizando tu perfil...' },
  { icon: '⚡', text: 'Calculando tu capacidad de recuperación...' },
  { icon: '🎯', text: 'Diseñando la estructura de entrenamiento...' },
  { icon: '💪', text: 'Seleccionando ejercicios óptimos...' },
  { icon: '📈', text: 'Ajustando la progresión de cargas...' },
  { icon: '🔥', text: '¡Tu plan personalizado está listo!' },
]

// ─── Other constants ──────────────────────────────────────────────────────────

const DISCOVERY_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'friend', label: 'Un amigo', icon: '👥' },
  { value: 'google', label: 'Google', icon: '🔍' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'other', label: 'Otro', icon: '✨' },
]

const MOCK_REVIEWS = [
  { name: 'Alejandro M.', stars: 5, text: 'Llevo 60 días sin faltar. Los rangos me tienen enganchado como un videojuego.' },
  { name: 'Laura G.', stars: 5, text: 'El plan con IA es brutal. Mis progresiones nunca habían sido tan consistentes.' },
  { name: 'Carlos B.', stars: 5, text: 'Llegué a ORO en espalda en 3 meses. Imposible sin FORGE.' },
]

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  push: { icon: '💪', label: 'Empuje', color: '#FF6B1A' },
  pull: { icon: '🔙', label: 'Tirón', color: '#4ADE80' },
  legs: { icon: '🦵', label: 'Piernas', color: '#F59E0B' },
  fullbody: { icon: '⚡', label: 'Cuerpo completo', color: '#8B5CF6' },
  hiit: { icon: '🔥', label: 'HIIT', color: '#EF4444' },
  custom: { icon: '✨', label: 'Personalizado', color: '#06B6D4' },
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return <>{count.toLocaleString()}</>
}

function ProUpsellStep({ onActivate, onSkip }: { onActivate: () => void; onSkip: () => void }) {
  const proItems = [
    { icon: '🤖', title: 'Plan IA personalizado', desc: 'FORGE IA diseña tu rutina perfecta' },
    { icon: '💎', title: 'Rangos musculares completos', desc: 'Sube de nivel como en un videojuego' },
    { icon: '📈', title: 'Sobrecarga progresiva IA', desc: 'Siempre el peso exacto para crecer' },
    { icon: '🏆', title: 'Estadísticas avanzadas', desc: 'Analiza cada detalle de tu progreso' },
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col p-6 pb-10">
      <div className="text-center mb-6 pt-4">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FFA052)' }}
        >
          <span className="text-3xl">👑</span>
        </motion.div>
        <h2 className="font-display text-4xl mb-2"><span className="text-gradient-forge">FORGE PRO</span></h2>
        <p className="text-forge-white/50 text-sm">Usuarios PRO ganan un <strong className="text-forge-orange">40% más de músculo</strong></p>
      </div>
      <div className="card-metal p-4 mb-5">
        <div className="flex flex-col gap-3">
          {proItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-semibold text-forge-white text-sm">{item.title}</div>
                <div className="text-xs text-forge-white/40">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.15), rgba(255,160,82,0.08))' }}>
        <div className="text-forge-white/50 text-xs mb-1">Plan anual — más popular</div>
        <div className="font-display text-4xl text-forge-white">€4.99<span className="text-lg text-forge-white/50">/mes</span></div>
        <div className="text-green-400 text-xs font-semibold mt-1">7 días GRATIS · Cancela cuando quieras</div>
      </div>
      <button onClick={onActivate} className="btn-forge w-full py-4 text-lg font-bold mb-3">Empezar prueba gratis 🔥</button>
      <button onClick={onSkip} className="w-full py-3 text-sm text-forge-white/30 hover:text-forge-white/50 transition-colors">Continuar con la versión gratuita</button>
    </motion.div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type Phase = 'slides' | 'questions' | 'personal_data' | 'counter' | 'reviews' | 'discovery' | 'generating' | 'plan_ready' | 'proupsell'

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding, activatePro, user } = useUserStore()
  const { addRoutine } = useWorkoutStore()
  const { updateProfile } = useAuth()
  const displayName = user?.displayName ?? 'Atleta'

  const [phase, setPhase] = useState<Phase>('slides')
  const [slideIdx, setSlideIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [personalStep, setPersonalStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({ hasUsedApp: false })
  const [direction, setDirection] = useState(1)

  // Personal data local inputs
  const [ageInput, setAgeInput] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([])

  // Generating state
  const [genMsgIdx, setGenMsgIdx] = useState(0)
  const [genApiDone, setGenApiDone] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<Routine[]>([])
  const genStarted = useRef(false)

  // Start AI generation when entering generating phase
  useEffect(() => {
    if (phase !== 'generating' || genStarted.current) return
    genStarted.current = true

    let msgI = 0
    const interval = setInterval(() => {
      msgI = Math.min(msgI + 1, GENERATING_MESSAGES.length - 1)
      setGenMsgIdx(msgI)
      if (msgI >= GENERATING_MESSAGES.length - 1) clearInterval(interval)
    }, 900)

    const apiKey = (import.meta.env.VITE_GROQ_API_KEY as string) ?? ''
    generatePersonalizedPlan({ questionnaire: answers, name: displayName, apiKey })
      .then(plan => { setGeneratedPlan(plan); setGenApiDone(true) })
      .catch(() => setGenApiDone(true))

    return () => clearInterval(interval)
  }, [phase])

  // Auto-advance to plan_ready when generation + messages both complete
  useEffect(() => {
    if (phase !== 'generating' || !genApiDone || genMsgIdx < GENERATING_MESSAGES.length - 1) return
    const t = setTimeout(() => setPhase('plan_ready'), 1200)
    return () => clearTimeout(t)
  }, [phase, genApiDone, genMsgIdx])

  const goNextSlide = () => {
    if (slideIdx < SLIDES.length - 1) setSlideIdx(i => i + 1)
    else setPhase('questions')
  }

  const selectAnswer = (key: string, value: string) => {
    const parsed = key === 'hasUsedApp' ? value === 'true' : value
    setAnswers(prev => ({ ...prev, [key]: parsed }))
    setTimeout(() => {
      if (questionIdx < QUESTIONS.length - 1) { setDirection(1); setQuestionIdx(i => i + 1) }
      else setPhase('personal_data')
    }, 120)
  }

  const goNextPersonalStep = () => {
    if (personalStep < 4) setPersonalStep(s => s + 1)
    else setPhase('counter')
  }

  const goPrevPersonalStep = () => {
    if (personalStep > 0) setPersonalStep(s => s - 1)
    else { setPhase('questions'); setQuestionIdx(QUESTIONS.length - 1) }
  }

  const toggleInjury = (val: string) =>
    setSelectedInjuries(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const finish = (pro: boolean) => {
    const finalAnswers: QuestionnaireAnswers = {
      ...(answers as QuestionnaireAnswers),
      injuries: selectedInjuries,
    }
    generatedPlan.forEach(r => addRoutine(r))
    completeOnboarding(finalAnswers)
    if (pro) activatePro()

    // Guardar en Supabase para que no vuelva a salir en próximas sesiones
    updateProfile({
      onboarding_complete: true,
      questionnaire: finalAnswers,
      goal: finalAnswers.goal,
      experience: finalAnswers.experience,
      equipment: finalAnswers.equipment,
      weight: finalAnswers.weight,
    }).catch(console.error)
  }

  // ── Slides ──
  if (phase === 'slides') {
    const slide = SLIDES[slideIdx]
    return (
      <div className="min-h-screen flex flex-col" style={{ background: slide.bg }}>
        <div className="flex items-center justify-center gap-2 pt-14">
          {SLIDES.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300" style={{ width: i === slideIdx ? 20 : 6, height: 6, backgroundColor: i === slideIdx ? '#FF6B1A' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <EmojiSlide key={slideIdx} slide={slide} onNext={goNextSlide} />
        </AnimatePresence>
      </div>
    )
  }

  // ── Counter ──
  if (phase === 'counter') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-forge-black">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4">
          <div className="font-display text-7xl text-forge-orange"><AnimatedCounter target={47382} duration={2200} /></div>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-forge-white text-xl font-semibold mb-2">forjadores activos</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-forge-white/50 text-sm mb-12 max-w-xs">Únete a la comunidad que está redefiniendo sus límites con FORGE</motion.p>
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} onClick={() => setPhase('reviews')} className="btn-forge px-10 py-4 text-lg">
          Ver testimonios <ChevronRight size={18} className="inline" />
        </motion.button>
      </div>
    )
  }

  // ── Reviews ──
  if (phase === 'reviews') {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-forge-black">
        <div className="flex-1 flex flex-col justify-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl text-gradient-forge text-center mb-2">LO QUE DICEN</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-forge-white/50 text-center text-sm mb-8">Miles de forjadores ya están subiendo de rango</motion.p>
          <div className="flex flex-col gap-4">
            {MOCK_REVIEWS.map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="card-metal p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-forge-orange/20 flex items-center justify-center text-forge-orange font-bold text-sm">{review.name[0]}</div>
                  <div>
                    <div className="font-semibold text-forge-white text-sm">{review.name}</div>
                    <div className="flex gap-0.5">{Array.from({ length: review.stars }).map((_, s) => <Star key={s} size={10} className="text-yellow-400 fill-yellow-400" />)}</div>
                  </div>
                </div>
                <p className="text-forge-white/70 text-sm leading-relaxed">"{review.text}"</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center justify-center gap-3 mt-6">
            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />)}</div>
            <div><span className="font-bold text-forge-white">4.9</span><span className="text-forge-white/40 text-sm"> · 2.847 valoraciones</span></div>
          </motion.div>
        </div>
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} onClick={() => setPhase('discovery')} className="btn-forge w-full py-4 text-lg mt-6">
          Continuar <ChevronRight size={18} className="inline" />
        </motion.button>
      </div>
    )
  }

  // ── Discovery ──
  if (phase === 'discovery') {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-forge-black">
        <div className="flex-1 flex flex-col justify-center">
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-bold text-2xl text-forge-white text-center mb-2">¿Cómo nos has conocido?</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-forge-white/50 text-center text-sm mb-8">Nos ayuda a mejorar nuestra comunidad</motion.p>
          <div className="grid grid-cols-2 gap-3">
            {DISCOVERY_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.value} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAnswers(prev => ({ ...prev, discovery: opt.value })); setPhase('generating') }}
                className="card-metal p-4 flex flex-col items-center gap-2 hover:border-forge-orange/40 transition-all"
              >
                <span className="text-3xl">{opt.icon}</span>
                <span className="text-sm font-medium text-forge-white">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Generating ──
  if (phase === 'generating') {
    const progress = (genMsgIdx / (GENERATING_MESSAGES.length - 1)) * 100
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: 'linear-gradient(160deg, #1a0800 0%, #08080E 50%, #0a0814 100%)' }}
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
          style={{ background: 'linear-gradient(135deg, #FF6B1A, #FF4500)', boxShadow: '0 0 60px rgba(255,107,26,0.5)' }}
        >
          <span className="text-5xl">⚡</span>
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl text-gradient-forge mb-1 text-center">
          IA FORJANDO
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-forge-white/40 text-sm mb-10 text-center">
          Tu plan único en el universo
        </motion.p>

        {/* Progress bar */}
        <div className="w-full max-w-xs mb-8">
          <div className="h-1.5 bg-forge-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FF6B1A, #FFD700)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
          <div className="text-right text-xs text-forge-white/30 mt-1">{Math.round(progress)}%</div>
        </div>

        {/* Status messages */}
        <div className="w-full max-w-xs space-y-3">
          {GENERATING_MESSAGES.slice(0, genMsgIdx + 1).map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <span className="text-xl w-7 flex-shrink-0 text-center">{msg.icon}</span>
              <span className={`text-sm flex-1 transition-all duration-300 ${i === genMsgIdx ? 'text-forge-white font-semibold' : 'text-forge-white/35'}`}>
                {msg.text}
              </span>
              {i < genMsgIdx && <Check size={13} className="text-forge-orange flex-shrink-0" />}
              {i === genMsgIdx && (
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-forge-orange flex-shrink-0" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  // ── Plan Ready ──
  if (phase === 'plan_ready') {
    const GOAL_LABELS: Record<string, string> = {
      muscle: 'ganar músculo', fat_loss: 'perder grasa', strength: 'aumentar fuerza', health: 'mejorar tu salud', sport: 'rendir en tu deporte',
    }
    const goalLabel = GOAL_LABELS[answers.goal ?? ''] ?? 'alcanzar tus metas'
    const hasApiKey = !!(import.meta.env.VITE_GROQ_API_KEY as string)

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col bg-forge-black">
        {/* Header */}
        <div className="pt-14 pb-6 px-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,107,26,0.12) 0%, transparent 100%)' }}>
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }} className="text-6xl mb-3">🏆</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display text-4xl text-gradient-forge mb-1">
            TU PLAN ESTÁ LISTO
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-forge-white/50 text-sm">
            {generatedPlan.length} rutinas diseñadas para {goalLabel}
            {hasApiKey ? ' · Generado con Groq IA ⚡' : ''}
          </motion.p>
        </div>

        {/* Routine cards */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {generatedPlan.map((routine, i) => {
            const cfg = CATEGORY_CONFIG[routine.category] ?? CATEGORY_CONFIG.custom
            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                className="card-metal p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ backgroundColor: `${cfg.color}20`, border: `1px solid ${cfg.color}30` }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-forge-white text-base leading-tight">{routine.name}</div>
                    <div className="text-forge-white/40 text-xs mb-2">{routine.description}</div>
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="text-forge-white/40">{routine.exercises.length} ejercicios</span>
                      <span className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <div className="flex gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="w-2 h-2 rounded-full" style={{ backgroundColor: j < routine.difficulty ? cfg.color : '#2A2A30' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Key exercises preview */}
                <div className="mt-3 pt-3 border-t border-forge-border/60 flex gap-2 overflow-x-auto no-scrollbar">
                  {routine.exercises.slice(0, 3).map(ex => (
                    <span key={ex.exerciseId} className="flex-shrink-0 px-2.5 py-1 bg-forge-black/80 rounded-lg text-xs text-forge-white/50">
                      {ex.exerciseId.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {routine.exercises.length > 3 && (
                    <span className="flex-shrink-0 px-2.5 py-1 bg-forge-black/80 rounded-lg text-xs text-forge-white/25">
                      +{routine.exercises.length - 3} más
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="px-4 pb-10 pt-4 border-t border-forge-border/40"
        >
          <button onClick={() => setPhase('proupsell')} className="btn-forge w-full py-4 text-lg">
            Comenzar mi forja 🔥
          </button>
        </motion.div>
      </motion.div>
    )
  }

  // ── Pro Upsell ──
  if (phase === 'proupsell') {
    return (
      <div className="min-h-screen flex flex-col bg-forge-black overflow-y-auto">
        <ProUpsellStep onActivate={() => finish(true)} onSkip={() => finish(false)} />
      </div>
    )
  }

  // ── Personal Data ──
  if (phase === 'personal_data') {
    const TOTAL_PERSONAL = 4
    const personalProgress = (personalStep / TOTAL_PERSONAL) * 100

    const PERSONAL_TITLES = [
      { q: '¿Cuántos años tienes?', sub: 'Y cuéntanos tu sexo biológico' },
      { q: '¿Cuánto pesas actualmente?', sub: 'Lo usaremos para calcular tu plan de nutrición' },
      { q: '¿Cuántos días puedes entrenar?', sub: 'Diseñaremos el split perfecto para ti' },
      { q: '¿Cuánto tiempo tienes por sesión?', sub: 'Optimizaremos el volumen para ese tiempo' },
      { q: '¿Tienes alguna molestia o dolor?', sub: 'Evitaremos ejercicios que te perjudiquen' },
    ]

    const { q: stepQ, sub: stepSub } = PERSONAL_TITLES[personalStep]

    return (
      <div className="min-h-screen bg-forge-black flex flex-col">
        {/* Progress */}
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={goPrevPersonalStep} className="text-forge-white/40 hover:text-forge-white transition-colors">
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1 h-1.5 bg-forge-border rounded-full overflow-hidden">
              <motion.div className="h-full bg-forge-orange rounded-full" animate={{ width: `${personalProgress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <span className="text-xs text-forge-white/30 font-mono">{personalStep + 1}/{TOTAL_PERSONAL + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-forge-orange/20 text-forge-orange">Datos personales</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={personalStep}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1 flex flex-col px-4 pb-8"
          >
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-forge-white mb-1">{stepQ}</h2>
              <p className="text-forge-white/50 text-sm">{stepSub}</p>
            </div>

            {/* Step 0: Age + Sex */}
            {personalStep === 0 && (
              <div className="flex flex-col gap-5">
                {/* Age input */}
                <div>
                  <label className="text-xs font-semibold text-forge-white/50 uppercase tracking-widest mb-2 block">Edad</label>
                  <div className="relative">
                    <input
                      type="number" inputMode="numeric" value={ageInput} onChange={e => setAgeInput(e.target.value)}
                      placeholder="25" min="13" max="100"
                      className="w-full bg-forge-iron border-2 border-forge-border rounded-2xl px-5 py-4 text-2xl font-bold text-forge-white text-center focus:outline-none focus:border-forge-orange transition-colors"
                      style={{ background: '#18181C' }}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-forge-white/30 font-semibold">años</span>
                  </div>
                </div>

                {/* Sex selection */}
                <div>
                  <label className="text-xs font-semibold text-forge-white/50 uppercase tracking-widest mb-2 block">Sexo biológico</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: 'male', label: 'Masculino', icon: '♂️', emoji: '🧔' }, { val: 'female', label: 'Femenino', icon: '♀️', emoji: '👩' }].map(opt => {
                      const selected = answers.sex === opt.val
                      return (
                        <motion.button
                          key={opt.val} whileTap={{ scale: 0.96 }}
                          onClick={() => setAnswers(prev => ({ ...prev, sex: opt.val as 'male' | 'female' }))}
                          className="card-metal p-5 flex flex-col items-center gap-2 border-2 transition-all"
                          style={{ borderColor: selected ? '#FF6B1A' : '#2A2A30', backgroundColor: selected ? '#FF6B1A10' : '#18181C' }}
                        >
                          <span className="text-4xl">{opt.emoji}</span>
                          <span className="font-bold text-forge-white">{opt.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={() => { setAnswers(prev => ({ ...prev, age: parseInt(ageInput) || undefined })); goNextPersonalStep() }}
                  disabled={!ageInput || !answers.sex}
                  className="btn-forge w-full py-4 text-base mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar <ChevronRight size={18} className="inline" />
                </button>
              </div>
            )}

            {/* Step 1: Weight */}
            {personalStep === 1 && (
              <div className="flex flex-col gap-5">
                <div className="relative">
                  <input
                    type="number" inputMode="decimal" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                    placeholder="70" min="30" max="300" step="0.5"
                    className="w-full border-2 border-forge-border rounded-2xl px-5 py-6 text-4xl font-bold text-forge-white text-center focus:outline-none focus:border-forge-orange transition-colors"
                    style={{ background: '#18181C' }}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-forge-white/40 text-xl font-bold">kg</span>
                </div>

                {/* Quick pick buttons */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {[55, 65, 70, 75, 80, 90, 100].map(w => (
                    <button
                      key={w} onClick={() => setWeightInput(String(w))}
                      className="px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{ borderColor: weightInput === String(w) ? '#FF6B1A' : '#2A2A30', color: weightInput === String(w) ? '#FF6B1A' : '#ffffff80', backgroundColor: weightInput === String(w) ? '#FF6B1A15' : '#18181C' }}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setAnswers(prev => ({ ...prev, weight: parseFloat(weightInput) || undefined })); goNextPersonalStep() }}
                  disabled={!weightInput}
                  className="btn-forge w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar <ChevronRight size={18} className="inline" />
                </button>
                <button onClick={goNextPersonalStep} className="w-full py-2 text-sm text-forge-white/25 hover:text-forge-white/40 transition-colors">
                  Omitir por ahora
                </button>
              </div>
            )}

            {/* Step 2: Training days */}
            {personalStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {[
                    { days: 2, label: '2 días', desc: 'Full body × 2 — Perfecto para empezar', emoji: '🌱' },
                    { days: 3, label: '3 días', desc: 'Push / Pull / Legs — El clásico eficiente', emoji: '⭐' },
                    { days: 4, label: '4 días', desc: 'Upper / Lower × 2 — Más volumen', emoji: '🔥' },
                    { days: 5, label: '5 días', desc: 'PPL + Upper + Lower — Alto rendimiento', emoji: '🏆' },
                    { days: 6, label: '6 días', desc: 'PPL × 2 — Para atletas dedicados', emoji: '💎' },
                  ].map(opt => {
                    const selected = answers.trainingDays === opt.days
                    return (
                      <motion.button
                        key={opt.days} whileTap={{ scale: 0.98 }}
                        onClick={() => { setAnswers(prev => ({ ...prev, trainingDays: opt.days })); setTimeout(goNextPersonalStep, 100) }}
                        className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                        style={{ borderColor: selected ? '#FF6B1A' : '#2A2A30', backgroundColor: selected ? '#FF6B1A10' : '#18181C' }}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="flex-1">
                          <div className="font-bold text-forge-white">{opt.label}</div>
                          <div className="text-xs text-forge-white/40">{opt.desc}</div>
                        </div>
                        {selected && <div className="w-5 h-5 rounded-full bg-forge-orange flex items-center justify-center flex-shrink-0"><Check size={12} className="text-white" /></div>}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Session duration */}
            {personalStep === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 30, label: '30 min', desc: 'Sesión express', icon: '⚡' },
                  { val: 45, label: '45 min', desc: 'Entrenamiento ágil', icon: '🎯' },
                  { val: 60, label: '60 min', desc: 'Sesión completa', icon: '💪' },
                  { val: 90, label: '90 min', desc: 'Máximo volumen', icon: '🔥' },
                ].map(opt => {
                  const selected = answers.sessionDuration === opt.val
                  return (
                    <motion.button
                      key={opt.val} whileTap={{ scale: 0.96 }}
                      onClick={() => { setAnswers(prev => ({ ...prev, sessionDuration: opt.val as 30 | 45 | 60 | 90 })); setTimeout(goNextPersonalStep, 100) }}
                      className="card-metal p-5 flex flex-col items-center gap-2 border-2 text-center transition-all"
                      style={{ borderColor: selected ? '#FF6B1A' : '#2A2A30', backgroundColor: selected ? '#FF6B1A10' : '#18181C' }}
                    >
                      <span className="text-3xl">{opt.icon}</span>
                      <div className="font-display text-2xl text-forge-white">{opt.label}</div>
                      <div className="text-xs text-forge-white/40">{opt.desc}</div>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Step 4: Injuries */}
            {personalStep === 4 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {INJURY_OPTIONS.map(opt => {
                    const active = selectedInjuries.includes(opt.value)
                    return (
                      <motion.button
                        key={opt.value} whileTap={{ scale: 0.95 }}
                        onClick={() => toggleInjury(opt.value)}
                        className="flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all"
                        style={{ borderColor: active ? '#EF4444' : '#2A2A30', backgroundColor: active ? '#EF444415' : '#18181C' }}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${active ? 'text-red-400' : 'text-forge-white'}`}>{opt.label}</div>
                        </div>
                        {active && <Check size={14} className="text-red-400 flex-shrink-0" />}
                      </motion.button>
                    )
                  })}
                </div>

                {selectedInjuries.length > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-forge-white/40 text-center">
                    {selectedInjuries.length} zona{selectedInjuries.length > 1 ? 's' : ''} seleccionada{selectedInjuries.length > 1 ? 's' : ''} — evitaremos sobrecargarlas
                  </motion.p>
                )}

                <button onClick={goNextPersonalStep} className="btn-forge w-full py-4 text-base mt-2">
                  {selectedInjuries.length === 0 ? 'No tengo molestias ✓' : 'Continuar con el plan'} <ChevronRight size={18} className="inline" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── Questions ──
  const currentQ = QUESTIONS[questionIdx]
  const progressPct = (questionIdx / QUESTIONS.length) * 100

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '80%' : '-80%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-80%' : '80%', opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-forge-black flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-3">
          {questionIdx > 0 && (
            <button onClick={() => { setDirection(-1); setQuestionIdx(i => i - 1) }} className="text-forge-white/40">
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="flex-1 h-1.5 bg-forge-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-forge-orange rounded-full" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="text-xs text-forge-white/30 font-mono">{questionIdx + 1}/{QUESTIONS.length}</span>
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={questionIdx} custom={direction} variants={variants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="flex-1 flex flex-col px-4 pb-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-forge-white mb-1">{currentQ.question}</h2>
            {currentQ.subtitle && <p className="text-forge-white/50 text-sm">{currentQ.subtitle}</p>}
          </div>

          {currentQ.type === 'bubble' ? (
            <div className="flex flex-wrap gap-3">
              {currentQ.options.map(opt => {
                const selected = answers[currentQ.key as keyof QuestionnaireAnswers] === opt.value
                return (
                  <motion.button key={opt.value} whileTap={{ scale: 0.95 }} onClick={() => selectAnswer(currentQ.key, opt.value)}
                    className="px-4 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-2"
                    style={{ borderColor: selected ? '#FF6B1A' : '#2A2A30', backgroundColor: selected ? '#FF6B1A15' : '#18181C', color: selected ? '#FF6B1A' : '#F5F5F0' }}
                  >
                    <span>{opt.icon}</span>{opt.label}
                  </motion.button>
                )
              })}
            </div>
          ) : currentQ.type === 'yesno' ? (
            <div className="grid grid-cols-2 gap-4">
              {currentQ.options.map(opt => (
                <motion.button key={opt.value} whileTap={{ scale: 0.95 }} onClick={() => selectAnswer(currentQ.key, opt.value)}
                  className="card-metal p-6 flex flex-col items-center gap-3 hover:border-forge-orange/50 transition-all"
                >
                  <span className="text-4xl">{opt.icon}</span>
                  <span className="font-bold text-forge-white text-lg">{opt.label}</span>
                  <span className="text-xs text-forge-white/40 text-center">{opt.desc}</span>
                </motion.button>
              ))}
            </div>
          ) : currentQ.type === 'card4' ? (
            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map(opt => {
                const selected = answers[currentQ.key as keyof QuestionnaireAnswers] === opt.value
                return (
                  <motion.button key={opt.value} whileTap={{ scale: 0.96 }} onClick={() => selectAnswer(currentQ.key, opt.value)}
                    className="card-metal p-4 flex flex-col items-center gap-2 text-center border-2 transition-all"
                    style={{ borderColor: selected ? '#FF6B1A' : '#2A2A30', backgroundColor: selected ? '#FF6B1A10' : '#18181C' }}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="font-semibold text-forge-white text-sm">{opt.label}</span>
                    <span className="text-xs text-forge-white/40">{opt.desc}</span>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {currentQ.options.map(opt => {
                const selected = answers[currentQ.key as keyof QuestionnaireAnswers] === opt.value
                return (
                  <motion.button key={opt.value} whileTap={{ scale: 0.98 }} onClick={() => selectAnswer(currentQ.key, opt.value)}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                    style={{ borderColor: selected ? '#FF6B1A' : '#2A2A30', backgroundColor: selected ? '#FF6B1A10' : '#18181C' }}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-forge-white">{opt.label}</div>
                      {opt.desc && <div className="text-sm text-forge-white/40">{opt.desc}</div>}
                    </div>
                    {selected && <div className="w-5 h-5 rounded-full bg-forge-orange flex items-center justify-center flex-shrink-0"><Check size={12} className="text-white" /></div>}
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default OnboardingPage
