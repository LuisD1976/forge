import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Send, Sparkles } from 'lucide-react'
import { useUserStore } from '../store/userStore'

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

export const AICoachPage: React.FC<AICoachPageProps> = ({ onBack, asTab }) => {
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

  return (
    <div className="flex flex-col bg-forge-black" style={{ height: asTab ? 'calc(100dvh - 64px)' : '100dvh' }}>
      {/* Header */}
      <div className="bg-forge-iron border-b border-forge-border px-4 pt-12 pb-4 flex items-center gap-3 flex-shrink-0">
        {!asTab && onBack && (
          <button onClick={onBack} className="text-forge-white/50">
            <ChevronLeft size={24} />
          </button>
        )}
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
      <div className="px-4 pb-5 pt-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,107,26,0.2)', backgroundColor: '#0D0D0F' }}>
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Escribe tu pregunta al Coach..."
            className="flex-1 rounded-2xl px-4 py-3 text-forge-white text-sm outline-none transition-all"
            style={{
              backgroundColor: '#1E1E26',
              border: '1.5px solid rgba(255,107,26,0.35)',
              color: '#F5F5F0',
            }}
            onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(255,107,26,0.8)' }}
            onBlur={e => { e.currentTarget.style.border = '1.5px solid rgba(255,107,26,0.35)' }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)', boxShadow: '0 4px 16px rgba(255,107,26,0.4)' }}
          >
            <Send size={17} className="text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default AICoachPage
