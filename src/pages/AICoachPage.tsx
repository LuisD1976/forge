import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Send, Sparkles, Calendar, Loader2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { generateMesocycle, type MesocycleWeek } from '../utils/claudeAPI'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: string
}

interface AICoachPageProps {
  onBack?: () => void
  onUpgrade?: () => void
  asTab?: boolean
}

const SUGGESTIONS = [
  '¿Cómo puedo aumentar mi press de banca?',
  '¿Qué debo comer antes de entrenar?',
  '¿Cuánto descanso entre series es óptimo?',
  '¿Cómo estructuro un programa PPL?',
]

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined

const PHASE_COLORS: Record<string, string> = {
  'Acumulación': '#3B82F6',
  'Intensificación': '#F97316',
  'Pico': '#EF4444',
  'Deload': '#4ADE80',
  'Tapering': '#8B5CF6',
  'Hipertrofia avanzada': '#EC4899',
}

function phaseColor(phase: string) {
  return Object.entries(PHASE_COLORS).find(([k]) => phase.includes(k))?.[1] ?? '#FF6B1A'
}

export const AICoachPage: React.FC<AICoachPageProps> = ({ onBack, asTab }) => {
  const { user } = useUserStore()
  const [tab, setTab] = useState<'chat' | 'meso'>('chat')

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `¡Hola${user?.displayName ? `, ${user.displayName}` : ''}! Soy tu Coach IA de FORGE. Estoy aquí para ayudarte con cualquier duda sobre entrenamiento, nutrición o planificación. ¿Qué quieres mejorar hoy?`,
      ts: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mesocycle state
  const [mesoGoal, setMesoGoal] = useState(user?.goal ?? 'muscle')
  const [mesoLevel, setMesoLevel] = useState(user?.experience ?? 'intermediate')
  const [mesoWeeks, setMesoWeeks] = useState<MesocycleWeek[]>([])
  const [mesoLoading, setMesoLoading] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), ts: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = messages.filter(m => m.id !== '0').slice(-12).map(m => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: userMsg.content })
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY ?? ''}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 600,
          temperature: 0.7,
          messages: [
            { role: 'system', content: `Eres el Coach IA de FORGE, la mejor app de fitness del mundo. Eres un experto en entrenamiento con pesas, nutrición deportiva, biomecánica y planificación. Responde siempre en español, de forma concisa, directa y muy motivadora. Usa bullet points cuando sea útil. Máximo 4-5 frases por respuesta. El usuario se llama ${user?.displayName ?? 'Atleta'} y su objetivo es ${user?.goal ?? 'mejorar su físico'}.` },
            ...history,
          ],
        }),
      })
      const data = await res.json()
      const reply: string = data.choices?.[0]?.message?.content ?? 'Lo siento, no pude procesar tu pregunta. Inténtalo de nuevo.'
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply, ts: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Error de conexión. Verifica tu conexión e inténtalo de nuevo.', ts: new Date().toISOString() }])
    }
    setLoading(false)
  }

  const handleGenerateMeso = async () => {
    setMesoLoading(true)
    const weeks = await generateMesocycle({ goal: mesoGoal, level: mesoLevel })
    setMesoWeeks(weeks)
    setMesoLoading(false)
  }

  return (
    <div className="flex flex-col bg-forge-black" style={{ height: asTab ? 'calc(100dvh - 64px)' : '100dvh' }}>
      {/* Header */}
      <div className="bg-forge-iron border-b border-forge-border px-4 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {!asTab && onBack && (
            <button onClick={onBack} className="text-forge-white/50"><ChevronLeft size={24} /></button>
          )}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-forge-white">FORGE Coach IA</h1>
            <p className="text-xs text-forge-white/40">Tu entrenador personal con inteligencia artificial</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-forge-black rounded-xl p-0.5">
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'chat' ? 'bg-forge-orange text-white' : 'text-forge-white/50'}`}
          >
            <Sparkles size={13} /> Chat
          </button>
          <button
            onClick={() => setTab('meso')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'meso' ? 'bg-forge-orange text-white' : 'text-forge-white/50'}`}
          >
            <Calendar size={13} /> Mesociclo
          </button>
        </div>
      </div>

      {/* Chat tab */}
      {tab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-1" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}>
                      <Sparkles size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-forge-orange text-white rounded-tr-sm' : 'bg-forge-iron border border-forge-border text-forge-white rounded-tl-sm'}`}>
                    {msg.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}>
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-forge-iron border border-forge-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-forge-orange" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-left p-3 rounded-xl bg-forge-iron border border-forge-border text-xs text-forge-white/60 hover:border-forge-orange/40 hover:text-forge-white transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="px-4 pb-5 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,107,26,0.2)', backgroundColor: '#0D0D0F' }}>
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Escribe tu pregunta al Coach..."
                className="flex-1 rounded-2xl px-4 py-3 text-forge-white text-sm outline-none transition-all"
                style={{ backgroundColor: '#1E1E26', border: '1.5px solid rgba(255,107,26,0.35)', color: '#F5F5F0' }}
                onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(255,107,26,0.8)' }}
                onBlur={e => { e.currentTarget.style.border = '1.5px solid rgba(255,107,26,0.35)' }}
              />
              <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} disabled={!input.trim() || loading} className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.4)' }}>
                <Send size={17} className="text-white" />
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* Mesociclo tab */}
      {tab === 'meso' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {mesoWeeks.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="card-metal p-4">
                <h3 className="font-semibold text-forge-white text-sm mb-3">Configura tu mesociclo</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-forge-white/50 mb-1.5 block">Objetivo</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[['muscle', 'Músculo'], ['fuerza', 'Fuerza'], ['endurance', 'Resistencia']].map(([val, label]) => (
                        <button key={val} onClick={() => setMesoGoal(val)} className={`py-2 rounded-xl text-xs font-semibold transition-all ${mesoGoal === val ? 'bg-forge-orange text-white' : 'bg-forge-iron border border-forge-border text-forge-white/50'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-forge-white/50 mb-1.5 block">Nivel</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[['beginner', 'Principiante'], ['intermediate', 'Intermedio'], ['advanced', 'Avanzado']].map(([val, label]) => (
                        <button key={val} onClick={() => setMesoLevel(val)} className={`py-2 rounded-xl text-xs font-semibold transition-all ${mesoLevel === val ? 'bg-forge-orange text-white' : 'bg-forge-iron border border-forge-border text-forge-white/50'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerateMeso}
                disabled={mesoLoading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 6px 24px rgba(255,107,26,0.4)', opacity: mesoLoading ? 0.7 : 1 }}
              >
                {mesoLoading ? <><Loader2 size={18} className="animate-spin" /> Generando plan...</> : <><Sparkles size={18} /> Generar Mesociclo 8 semanas</>}
              </motion.button>

              <div className="text-center text-xs text-forge-white/25 px-4">
                La IA creará un plan periodizado con sobrecarga progresiva, fases de acumulación, intensificación y deload.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-forge-white">Tu Mesociclo de 8 semanas</h3>
                <button onClick={() => setMesoWeeks([])} className="text-xs text-forge-white/40 hover:text-forge-white transition-colors">Reiniciar</button>
              </div>
              {mesoWeeks.map((week) => {
                const color = phaseColor(week.phase)
                return (
                  <motion.div
                    key={week.week}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: week.week * 0.05 }}
                    className="rounded-2xl p-4 overflow-hidden"
                    style={{ background: `${color}08`, border: `1px solid ${color}25` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>Sem {week.week}</span>
                        <span className="text-xs font-bold" style={{ color }}>{week.phase}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-forge-white">{week.volume}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>{week.intensity}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-forge-white mb-1">{week.focus}</p>
                    <p className="text-xs text-forge-white/50 mb-2">{week.notes}</p>
                    {week.mainLifts?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {week.mainLifts.slice(0, 3).map((lift, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{lift}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
              <div className="text-center text-xs text-forge-white/25 py-4">
                Plan personalizado · Ajusta peso cada semana según el % de 1RM indicado
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AICoachPage
