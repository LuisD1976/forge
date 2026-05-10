import React, { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'

interface WorkoutTimerProps {
  initialSeconds?: number
  onComplete?: () => void
  autoStart?: boolean
  compact?: boolean
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const beep = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(vol, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    beep(660, 0,    0.12, 0.4)
    beep(880, 0.15, 0.12, 0.4)
    beep(1100, 0.3, 0.25, 0.5)
  } catch {}
}

function vibrate() {
  try { navigator.vibrate?.([120, 80, 120, 80, 200]) } catch {}
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  initialSeconds = 0,
  onComplete,
  autoStart = false,
  compact = false,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const isCountdown = initialSeconds > 0

  const handleComplete = useCallback(() => {
    setIsRunning(false)
    playBeep()
    vibrate()
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    setSeconds(initialSeconds)
    setIsRunning(autoStart)
  }, [initialSeconds])

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (isCountdown) {
          if (prev <= 1) { handleComplete(); return 0 }
          return prev - 1
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, isCountdown, handleComplete])

  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const reset = () => { setIsRunning(false); setSeconds(initialSeconds) }
  const adjust = (delta: number) => setSeconds((s) => Math.max(0, s + delta))

  const progress = isCountdown && initialSeconds > 0
    ? ((initialSeconds - seconds) / initialSeconds) * 100
    : 0

  const urgentColor = seconds <= 5 && isCountdown && isRunning ? '#EF4444' : '#FF6B1A'

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => adjust(-15)} className="text-forge-white/40 hover:text-forge-white transition-colors p-1">
          <Minus size={14} />
        </button>
        <span className="font-mono text-xl font-bold" style={{ color: urgentColor, minWidth: 48, textAlign: 'center' }}>
          {format(seconds)}
        </span>
        <button onClick={() => adjust(15)} className="text-forge-white/40 hover:text-forge-white transition-colors p-1">
          <Plus size={14} />
        </button>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="text-forge-white/60 hover:text-forge-orange transition-colors p-1"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    )
  }

  const r = 44
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#2A2A30" strokeWidth="7" />
          {isCountdown && (
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={urgentColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress / 100)}
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 6px ${urgentColor}80)` }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="font-mono text-3xl font-bold text-forge-white">{format(seconds)}</span>
          {isCountdown && (
            <span className="text-[10px] text-forge-white/30 uppercase tracking-wider">descanso</span>
          )}
        </div>
      </div>

      {/* Adjust buttons */}
      <div className="flex items-center gap-2">
        {[15, 30].map((d) => (
          <button
            key={d}
            onClick={() => adjust(-d)}
            className="text-xs text-forge-white/40 hover:text-forge-white transition-colors bg-forge-border rounded-lg px-2 py-1"
          >
            -{d}s
          </button>
        ))}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all active:scale-95 mx-2"
          style={{ background: `linear-gradient(135deg, ${urgentColor} 0%, #FFA052 100%)`, boxShadow: `0 4px 20px ${urgentColor}50` }}
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} />}
        </button>
        {[15, 30].map((d) => (
          <button
            key={d}
            onClick={() => adjust(d)}
            className="text-xs text-forge-white/40 hover:text-forge-white transition-colors bg-forge-border rounded-lg px-2 py-1"
          >
            +{d}s
          </button>
        ))}
      </div>

      <button onClick={reset} className="text-xs text-forge-white/30 hover:text-forge-white/60 transition-colors flex items-center gap-1">
        <RotateCcw size={12} />
        Reiniciar
      </button>
    </div>
  )
}

export default WorkoutTimer
