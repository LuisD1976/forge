import React, { useMemo, useState } from 'react'
import { useWorkoutStore } from '../store/workoutStore'

export const WorkoutHeatmap: React.FC = () => {
  const { sessions } = useWorkoutStore()
  const [mode, setMode] = useState<'12w' | 'all'>('12w')

  const { weeks, maxVolume, totalDays } = useMemo(() => {
    const volumeByDate: Record<string, number> = {}
    sessions.forEach((s) => {
      const date = new Date(s.date).toISOString().split('T')[0]
      volumeByDate[date] = (volumeByDate[date] ?? 0) + s.totalVolume
    })

    const today = new Date()
    let startDate: Date

    if (mode === 'all' && sessions.length > 0) {
      const earliest = sessions.reduce((min, s) => s.date < min ? s.date : min, sessions[0].date)
      startDate = new Date(earliest)
      // Align to start of week (Monday)
      const dow = startDate.getDay()
      const offset = dow === 0 ? 6 : dow - 1
      startDate.setDate(startDate.getDate() - offset)
    } else {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 83)
    }

    const days: { date: string; volume: number; label: string }[] = []
    const d = new Date(startDate)
    while (d <= today) {
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        volume: volumeByDate[dateStr] ?? 0,
        label: d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }),
      })
      d.setDate(d.getDate() + 1)
    }

    const max = Math.max(...days.map((d) => d.volume), 1)
    const ws: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) ws.push(days.slice(i, i + 7))
    return { weeks: ws, maxVolume: max, totalDays: days.length }
  }, [sessions, mode])

  const getColor = (volume: number) => {
    if (volume === 0) return 'rgba(255,255,255,0.05)'
    const t = Math.min(volume / maxVolume, 1)
    if (t < 0.25) return 'rgba(255,107,26,0.25)'
    if (t < 0.5)  return 'rgba(255,107,26,0.5)'
    if (t < 0.75) return 'rgba(255,107,26,0.75)'
    return '#FF6B1A'
  }

  const recentSessions = sessions.filter((s) => Date.now() - new Date(s.date).getTime() < 84 * 86400000).length

  return (
    <div className="card-metal p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-forge-white">Actividad</span>
        <div className="flex gap-1 bg-forge-black rounded-lg p-0.5">
          <button
            onClick={() => setMode('12w')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${mode === '12w' ? 'bg-forge-orange text-white' : 'text-forge-white/40'}`}
          >
            12 sem
          </button>
          <button
            onClick={() => setMode('all')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${mode === 'all' ? 'bg-forge-orange text-white' : 'text-forge-white/40'}`}
          >
            Historial
          </button>
        </div>
      </div>
      <p className="text-xs text-forge-white/30 mb-3">
        {mode === '12w'
          ? `${recentSessions} entrenos en 12 semanas · ${sessions.length} en total`
          : `${sessions.length} entrenos en ${Math.ceil(totalDays / 7)} semanas`}
      </p>

      {/* Day labels */}
      <div className="flex gap-1 mb-1">
        {['L','M','X','J','V','S','D'].map((d) => (
          <div key={d} className="w-3 text-center text-[8px] text-forge-white/20 font-medium">{d}</div>
        ))}
      </div>

      {/* Grid — scrollable in all-time mode */}
      <div className={mode === 'all' ? 'overflow-x-auto' : ''}>
        <div className="flex gap-1" style={{ minWidth: mode === 'all' ? `${weeks.length * 16}px` : undefined }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week[di]
                if (!day) return <div key={di} className="w-3 h-3" />
                return (
                  <div
                    key={di}
                    className="w-3 h-3 rounded-sm transition-colors"
                    style={{ backgroundColor: getColor(day.volume) }}
                    title={day.volume > 0
                      ? `${day.label}: ${(day.volume / 1000).toFixed(1)}t`
                      : day.label}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-forge-white/25 mr-1">Menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: v === 0 ? 'rgba(255,255,255,0.05)' : `rgba(255,107,26,${v * 0.75 + 0.25})` }}
          />
        ))}
        <span className="text-[10px] text-forge-white/25 ml-1">Más</span>
      </div>
    </div>
  )
}
