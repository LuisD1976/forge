import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useWorkoutStore } from '../store/workoutStore'
import { EXERCISES } from '../data/exercises'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: '#13131A', border: '1px solid #252530' }}>
      <div className="text-forge-white/50 mb-0.5">{label}</div>
      <div className="font-bold" style={{ color: '#FF6B1A' }}>{payload[0].value} kg</div>
    </div>
  )
}

export const ExerciseProgressChart: React.FC = () => {
  const { sessions } = useWorkoutStore()
  const [selectedId, setSelectedId] = useState('bench_press')

  const exercisesWithData = useMemo(() => {
    const ids = new Set<string>()
    sessions.forEach((s) => s.exercises.forEach((e) => ids.add(e.exerciseId)))
    const withData = EXERCISES.filter((e) => ids.has(e.id))
    return withData.length > 0 ? withData : EXERCISES.slice(0, 8)
  }, [sessions])

  const data = useMemo(() => {
    const points: { date: string; weight: number }[] = []
    ;[...sessions].reverse().forEach((session) => {
      const ex = session.exercises.find((e) => e.exerciseId === selectedId)
      if (!ex) return
      const maxWeight = Math.max(
        ...ex.sets.filter((s) => s.completed && s.weight > 0).map((s) => s.weight),
        0
      )
      if (maxWeight === 0) return
      points.push({
        date: new Date(session.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        weight: maxWeight,
      })
    })
    return points
  }, [sessions, selectedId])

  const trend = useMemo(() => {
    if (data.length < 2) return 0
    return data[data.length - 1].weight - data[0].weight
  }, [data])

  if (sessions.length === 0) return null

  return (
    <div className="card-metal p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-forge-white">Progreso</span>
          {data.length >= 2 && (
            <div
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: trend > 0 ? 'rgba(74,222,128,0.12)' : trend < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                color: trend > 0 ? '#4ADE80' : trend < 0 ? '#EF4444' : 'rgba(255,255,255,0.4)',
              }}
            >
              {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {trend > 0 ? `+${trend}` : trend}kg
            </div>
          )}
        </div>
      </div>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full mb-4 text-forge-white text-xs rounded-xl px-3 py-2 outline-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {exercisesWithData.map((e) => (
          <option key={e.id} value={e.id} style={{ backgroundColor: '#13131A' }}>
            {e.name}
          </option>
        ))}
      </select>

      {data.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-2xl opacity-40">📈</span>
          <p className="text-forge-white/30 text-xs text-center">
            Completa más sesiones con este ejercicio para ver tu progreso
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 8, bottom: 5, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              unit="kg"
            />
            <Tooltip content={<CustomTooltip />} />
            {data.length > 0 && (
              <ReferenceLine
                y={data[0].weight}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
              />
            )}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#FF6B1A"
              strokeWidth={2.5}
              dot={{ fill: '#FF6B1A', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#FFA052', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
