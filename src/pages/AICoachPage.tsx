import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Send, Sparkles, Lock, Crown } from 'lucide-react'
import { useUserStore } from '../store/userStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: string
}

interface AICoachPageProps {
  onBack: () => void
  onUpgrade: () => void
}

const SUGGESTIONS = [
  '¿Cómo puedo aumentar mi press de banca?',
  '¿Qué debo comer antes de entrenar?',
  '¿Cuánto descanso entre series es óptimo?',
  '¿Cómo estructuro un programa PPL?',
]

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined

export const AICoachPage: React.FC<AICoachPageProps> = ({ onBack, onUpgrade }) => {
  const { user } = useUserStore()
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      ts: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages
        .filter(m => m.id !== '0')
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: userMsg.content })

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY ?? ''}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 600,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `Eres el Coach IA de FORGE, la mejor app de fitness del mundo. Eres un experto en entrenamiento con pesas, nutrición deportiva, biomecánica y planificación. Responde siempre en español, de forma concisa, directa y muy motivadora. Usa bullet points cuando sea útil. Máximo 4-5 frases por respuesta. El usuario se llama ${user?.displayName ?? 'Atleta'} y su objetivo es ${user?.goal ?? 'mejorar su físico'}.`,
            },
            ...history,
          ],
        }),
      })

      const data = await res.json()
      const reply: string = data.choices?.[0]?.message?.content ?? 'Lo siento, no pude procesar tu pregunta. Inténtalo de nuevo.'

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply, ts: new Date().toISOString() },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
          ts: new Date().toISOString(),
        },
      ])
    }
    setLoading(false)
  }

  if (!user?.isPro) {
    return (
      <div className="min-h-screen bg-forge-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-forge-iron border border-forge-border">
            <Lock size={36} className="text-forge-white/30" />
          </div>
        </motion.div>
        <h2 className="font-display text-3xl text-forge-white mb-3">FORGE Coach IA</h2>
        <p className="text-forge-white/50 mb-8 max-w-xs">
          El Coach IA está disponible exclusivamente para usuarios FORGE PRO. Desbloquea asesoramiento personalizado con inteligencia artificial.
        </p>
        <button onClick={onUpgrade} className="btn-forge px-8 py-4 flex items-center gap-2">
          <Crown size={18} />
          Hacerse PRO
        </button>
        <button onClick={onBack} className="mt-4 text-forge-white/30 text-sm">Volver</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-forge-black">
      {/* Header */}
      <div className="bg-forge-iron border-b border-forge-border px-4 pt-12 pb-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-forge-white/50">
          <ChevronLeft size={24} />
        </button>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
        >
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-forge-white">FORGE Coach IA</h1>
          <p className="text-xs text-forge-white/40">Tu entrenador personal con inteligencia artificial</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                  style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
                >
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-forge-orange text-white rounded-tr-sm'
                    : 'bg-forge-iron border border-forge-border text-forge-white rounded-tl-sm'
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                ))}
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
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-forge-orange"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions when empty */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-left p-3 rounded-xl bg-forge-iron border border-forge-border text-xs text-forge-white/60 hover:border-forge-orange/40 hover:text-forge-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 border-t border-forge-border flex-shrink-0 bg-forge-black">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pregunta a tu Coach IA..."
            className="flex-1 bg-forge-iron border border-forge-border rounded-2xl px-4 py-3 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
          >
            <Send size={16} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default AICoachPage
