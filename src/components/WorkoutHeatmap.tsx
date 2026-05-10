import React, { useMemo } from 'react'
import { useWorkoutStore } from '../store/workoutStore'

export const WorkoutHeatmap: React.FC = () => {
  const { sessions } = useWorkoutStore()

  const { weeks, maxVolume } = useMemo(() => {
    const volumeByDate: Record<string, number> = {}
    sessions.forEach((s) => {
      const date = new Date(s.date).toISOString().split('T')[0]
      volumeByDate[date] = (volumeByDate[date] ?? 0) + s.totalVolume
    })

    const days: { date: string; volume: number; label: string }[] = []
    const today = new Date()
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        volume: volumeByDate[dateStr] ?? 0,
        label: d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }),
      })
    }

    const max = Math.max(...days.map((d) => d.volume), 1)
    const ws: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) ws.push(days.slice(i, i + 7))
    return { weeks: ws, maxVolume: max }
  }, [sessions])

  const getColor = (volume: number) => {
    if (volume === 0) return 'rgba(255,255,255,0.05)'
    const t = Math.min(volume / maxVolume, 1)
    if (t < 0.25) return 'rgba(255,107,26,0.25)'
    if (t < 0.5)  return 'rgba(255,107,26,0.5)'
    if (t < 0.75) return 'rgba(255,107,26,0.75)'
    return '#FF6B1A'
  }

  const totalSessions = sessions.length
  const recentSessions = sessions.filter((s) => {
    const diff = Date.now() - new Date(s.date).getTime()
    return diff < 84 * 86400000
  }).length

  return (
    <div className="card-metal p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-forge-white">Actividad</span>
        <span className="text-xs text-forge-white/40">{recentSessions} entrenos en 12 semanas</span>
      </div>
      <p className="text-xs text-forge-white/30 mb-3">{totalSessions} entrenos en total</p>

      {/* Day labels */}
      <div className="flex gap-1 mb-1 ml-0">
        {['L','M','X','J','V','S','D'].map((d) => (
          <div key={d} className="w-3 text-center text-[8px] text-forge-white/20 font-medium">{d}</div>
        ))}
      </div>

      {/* Grid — rows=days of week, cols=weeks */}
      <div className="flex gap-1">
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
