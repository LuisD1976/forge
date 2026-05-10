import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setSuccessMessage(null)
    setPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (mode === 'register') {
      if (!displayName.trim()) return setError('Ingresa tu nombre')
      if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
      if (password !== confirmPassword) return setError('Las contraseñas no coinciden')
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(translateError(error.message))
      } else {
        const { error } = await signUp(email, password, displayName.trim())
        if (error) {
          setError(translateError((error as { message: string }).message))
        } else {
          setSuccessMessage('Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.')
          switchMode('login')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-black flex flex-col items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #FF6B1A 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-6xl text-gradient-forge tracking-wider mb-2">FORGE</h1>
        <p className="text-forge-white/40 text-sm">Forja tu cuerpo. Forja tu mente.</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card-metal w-full max-w-sm p-6"
      >
        {/* Tab toggle */}
        <div className="flex bg-forge-black rounded-xl p-1 mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? 'bg-forge-orange text-white shadow-lg'
                  : 'text-forge-white/40 hover:text-forge-white/70'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {/* Display name (register only) */}
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-white/30 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-forge-black border border-forge-border rounded-xl pl-10 pr-4 py-3 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors placeholder:text-forge-white/25"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-white/30 w-4 h-4" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-forge-black border border-forge-border rounded-xl pl-10 pr-4 py-3 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors placeholder:text-forge-white/25"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-white/30 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-forge-black border border-forge-border rounded-xl pl-10 pr-10 py-3 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors placeholder:text-forge-white/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-white/30 hover:text-forge-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-white/30 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-forge-black border border-forge-border rounded-xl pl-10 pr-4 py-3 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors placeholder:text-forge-white/25"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-forge-red text-xs text-center bg-forge-red/10 border border-forge-red/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Success */}
            {successMessage && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-forge-green text-xs text-center bg-forge-green/10 border border-forge-green/20 rounded-lg px-3 py-2"
              >
                {successMessage}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-forge flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                'Entrar a FORGE'
              ) : (
                'Crear cuenta'
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Forgot password (login only) */}
        {mode === 'login' && (
          <p className="text-center mt-4 text-xs text-forge-white/30">
            <button
              onClick={async () => {
                if (!email) return setError('Ingresa tu email primero')
                setLoading(true)
                const { error } = await supabase.auth.resetPasswordForEmail(email)
                setLoading(false)
                if (error) setError(translateError(error.message))
                else setSuccessMessage('Revisa tu email para restablecer la contraseña')
              }}
              className="hover:text-forge-white/60 transition-colors underline underline-offset-2"
            >
              Olvidé mi contraseña
            </button>
          </p>
        )}
      </motion.div>

      <p className="mt-6 text-xs text-forge-white/20 text-center max-w-xs">
        Al continuar aceptas los Términos de Servicio y la Política de Privacidad de FORGE
      </p>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de iniciar sesión'
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email'
  if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('Unable to validate email')) return 'Email inválido'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos.'
  return msg
}
