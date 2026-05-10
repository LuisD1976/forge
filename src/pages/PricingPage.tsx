import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, X, ChevronLeft, Sparkles, Zap, BarChart3, Lock, Star } from 'lucide-react'
import { useUserStore } from '../store/userStore'

interface PricingPageProps {
  onBack: () => void
}

const PRO_FEATURES = [
  { icon: Sparkles, title: 'Plan personalizado con IA', desc: 'Planificación semanal adaptada a tus objetivos' },
  { icon: Zap, title: 'Análisis corporal con IA', desc: 'Identifica tus puntos débiles y fuertes' },
  { icon: Crown, title: 'Rangos musculares completos', desc: 'Sube de nivel tu físico como un videojuego' },
  { icon: BarChart3, title: 'Sobrecarga progresiva automática', desc: 'La IA calcula tus pesos en cada entrenamiento' },
  { icon: Star, title: 'Generador de rutinas con IA', desc: 'Personaliza y crea entrenamientos en segundos' },
  { icon: Lock, title: 'Rutinas y planes ilimitados', desc: 'Sin límites en tu progresión' },
]

const COMPARISON_ROWS = [
  { label: 'Registrar entrenamientos', free: true, pro: true },
  { label: 'Rutinas prediseñadas', free: true, pro: true },
  { label: 'Sistema de rangos básico', free: true, pro: true },
  { label: 'Plan personalizado IA', free: false, pro: true },
  { label: 'Análisis corporal IA', free: false, pro: true },
  { label: 'Sobrecarga progresiva IA', free: false, pro: true },
  { label: 'Rutinas ilimitadas', free: false, pro: true },
  { label: 'Generación con IA', free: false, pro: true },
  { label: 'Estadísticas avanzadas', free: false, pro: true },
  { label: 'Sin anuncios', free: false, pro: true },
  { label: 'Soporte prioritario', free: false, pro: true },
]

const PLANS = [
  {
    id: 'monthly',
    label: 'MENSUAL',
    price: '€9.99',
    period: '/mes',
    sub: 'Cancela cuando quieras',
    popular: false,
    badge: null,
  },
  {
    id: 'annual',
    label: 'ANUAL',
    price: '€59.99',
    period: '/año',
    sub: '€4.99/mes • Ahorra 50%',
    popular: true,
    badge: '⭐ POPULAR',
  },
  {
    id: 'lifetime',
    label: 'DE POR VIDA',
    price: '€149.99',
    period: '',
    sub: 'Pago único • Acceso ilimitado',
    popular: false,
    badge: '♾️',
  },
]

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1 }}
          animate={{ y: window.innerHeight + 20, opacity: 0 }}
          transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.5 }}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: ['#FF6B1A', '#FFA052', '#FFD700', '#4ADE80', '#67E8F9'][i % 5],
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const { user, activatePro } = useUserStore()
  const [selectedPlan, setSelectedPlan] = useState('annual')
  const [activated, setActivated] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  if (user?.isPro || activated) {
    return (
      <div className="min-h-screen bg-forge-black flex flex-col items-center justify-center p-6 text-center">
        {showConfetti && <Confetti />}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FFA052)' }}
          >
            <Crown size={48} className="text-black" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-4xl text-forge-orange mb-3"
        >
          ¡BIENVENIDO A FORGE PRO!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-forge-white/60 mb-8 max-w-xs"
        >
          Todas las funciones PRO están desbloqueadas. Ahora forja con el poder de la IA.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onBack}
          className="btn-forge px-8 py-4 text-lg"
        >
          Empezar a forjar
        </motion.button>
      </div>
    )
  }

  const handleActivate = () => {
    activatePro()
    setActivated(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  return (
    <div className="flex flex-col pb-10 min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="text-forge-white/50 hover:text-forge-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FFA052)' }}
          >
            <Crown size={16} className="text-black" />
          </div>
          <span className="font-display text-xl text-forge-orange">FORGE PRO</span>
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 pt-4 pb-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl text-forge-white mb-2"
        >
          Usuarios PRO ganan un{' '}
          <span className="text-gradient-forge">40% más de músculo</span>
        </motion.h1>
        <p className="text-forge-white/50 text-sm">Con planes de IA y seguimiento inteligente</p>
      </div>

      {/* Features */}
      <div className="mx-4 mb-6">
        <div className="card-metal p-5">
          <h3 className="font-semibold text-forge-white mb-4 text-sm uppercase tracking-wider text-forge-white/50">
            Todo incluido en PRO
          </h3>
          <div className="flex flex-col gap-4">
            {PRO_FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.2), rgba(255,160,82,0.1))' }}
                  >
                    <Icon size={16} className="text-forge-orange" />
                  </div>
                  <div>
                    <div className="font-semibold text-forge-white text-sm">{f.title}</div>
                    <div className="text-xs text-forge-white/40">{f.desc}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <p className="text-xs text-forge-orange/60 mt-4 text-center">¡y más por venir!</p>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mx-4 mb-6">
        <div className="card-metal overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-semibold bg-forge-border/30">
            <div className="px-3 py-2 text-forge-white/50">Función</div>
            <div className="px-3 py-2 text-center text-forge-white/50">GRATIS</div>
            <div className="px-3 py-2 text-center text-forge-orange">PRO</div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 text-xs border-t border-forge-border ${i % 2 === 0 ? '' : 'bg-forge-border/10'}`}
            >
              <div className="px-3 py-2.5 text-forge-white/70">{row.label}</div>
              <div className="px-3 py-2.5 flex items-center justify-center">
                {row.free ? (
                  <Check size={14} className="text-forge-green" />
                ) : (
                  <X size={14} className="text-forge-white/20" />
                )}
              </div>
              <div className="px-3 py-2.5 flex items-center justify-center">
                <Check size={14} className="text-forge-orange" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price cards */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold text-forge-white mb-3 text-center">Elige tu plan</h3>
        <div className="flex flex-col gap-3">
          {PLANS.map((plan) => (
            <motion.button
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-forge-orange bg-forge-orange/10'
                  : 'border-forge-border bg-forge-iron hover:border-forge-orange/40'
              }`}
            >
              {plan.badge && (
                <div
                  className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', color: 'white' }}
                >
                  {plan.badge}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-forge-white text-sm">{plan.label}</div>
                  <div className="text-xs text-forge-white/50 mt-0.5">{plan.sub}</div>
                  {plan.id === 'annual' && (
                    <div className="text-xs text-forge-green font-semibold mt-0.5">7 días gratis</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl text-forge-white">{plan.price}</div>
                  {plan.period && <div className="text-xs text-forge-white/50">{plan.period}</div>}
                </div>
              </div>
              {selectedPlan === plan.id && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-forge-orange flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4">
        <button onClick={handleActivate} className="btn-forge w-full py-4 text-lg font-bold">
          Empezar prueba gratis de 7 días
        </button>
        <p className="text-center text-xs text-forge-white/30 mt-2">
          Cancela cuando quieras. Sin compromiso.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {[
            'Acceso a todas las funciones PRO',
            'Cancela en cualquier momento',
            'Garantía de devolución 30 días',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-forge-white/60">
              <Check size={14} className="text-forge-green flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-forge-white/20 mt-4">
          Demo — en producción se integraría con Stripe o RevenueCat
        </p>
      </div>
    </div>
  )
}

export default PricingPage
