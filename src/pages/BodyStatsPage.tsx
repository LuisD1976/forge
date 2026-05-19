import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Scale, Ruler, TrendingUp, Zap,
  Plus, CheckCircle, Activity,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts'
import { useBodyStore } from '../store/bodyStore'
import { useUserStore } from '../store/userStore'

interface BodyStatsPageProps {
  onBack: () => void
}

type Tab = 'stats' | 'chart' | 'tdee'

const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Sedentario',      desc: 'Sin ejercicio',           factor: 1.2   },
  { id: 'light',      label: 'Ligero',           desc: '1-3 días/semana',         factor: 1.375 },
  { id: 'moderate',  label: 'Moderado',          desc: '3-5 días/semana',         factor: 1.55  },
  { id: 'active',    label: 'Activo',            desc: '6-7 días/semana',         factor: 1.725 },
  { id: 'very',      label: 'Muy activo',        desc: 'Doble sesión diaria',     factor: 1.9   },
]

function calcBMR(weight: number, height: number, age: number, gender: 'male' | 'female') {
  // Mifflin-St Jeor
  return gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161
}

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return { label: 'Bajo peso', color: '#67E8F9' }
  if (bmi < 25)   return { label: 'Normal',    color: '#4ADE80' }
  if (bmi < 30)   return { label: 'Sobrepeso', color: '#FFA052' }
  return               { label: 'Obesidad',    color: '#EF4444' }
}

export function BodyStatsPage({ onBack }: BodyStatsPageProps) {
  const { measurements, addMeasurement, getLatest, getWeightHistory } = useBodyStore()
  const { user } = useUserStore()
  const [tab, setTab] = useState<Tab>('stats')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const latest = getLatest()
  const [weight, setWeight]   = useState(latest?.weight?.toString()   ?? user?.weight?.toString() ?? '')
  const [height, setHeight]   = useState(latest?.height?.toString()   ?? user?.height?.toString() ?? '')
  const [bodyFat, setBodyFat] = useState(latest?.bodyFat?.toString()  ?? '')
  const [waist, setWaist]     = useState(latest?.waist?.toString()    ?? '')
  const [chest, setChest]     = useState(latest?.chest?.toString()    ?? '')
  const [arms, setArms]       = useState(latest?.arms?.toString()     ?? '')
  const [hips, setHips]        = useState(latest?.hips?.toString()    ?? '')

  // TDEE form — pre-fill from onboarding questionnaire when available
  const [tdeeAge,      setTdeeAge]      = useState(() => user?.questionnaire?.age?.toString() ?? '30')
  const [tdeeGender,   setTdeeGender]   = useState<'male' | 'female'>(() =>
    user?.questionnaire?.sex === 'female' ? 'female' : 'male'
  )
  const [tdeeActivity, setTdeeActivity] = useState('moderate')
  const [tdeeGoal,     setTdeeGoal]     = useState<'cut' | 'maintain' | 'bulk'>(() => {
    const g = user?.goal
    if (g === 'fat_loss') return 'cut'
    if (g === 'strength' || g === 'muscle') return 'bulk'
    return 'maintain'
  })

  const handleSave = async () => {
    if (!weight && !height) return
    setSaving(true)
    await addMeasurement({
      date: new Date().toISOString(),
      weight:  weight  ? parseFloat(weight)  : undefined,
      height:  height  ? parseFloat(height)  : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      waist:   waist   ? parseFloat(waist)   : undefined,
      chest:   chest   ? parseFloat(chest)   : undefined,
      arms:    arms    ? parseFloat(arms)    : undefined,
      hips:    hips    ? parseFloat(hips)    : undefined,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const weightHistory = getWeightHistory(60)

  const bodyFatHistory = measurements
    .filter((m) => m.bodyFat)
    .slice(0, 30)
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      bodyFat: m.bodyFat!,
    }))

  const circumHistory = measurements
    .filter((m) => m.waist || m.chest || m.arms)
    .slice(0, 30)
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      waist: m.waist,
      chest: m.chest,
      arms: m.arms,
    }))

  const bmi = latest?.weight && latest?.height
    ? latest.weight / Math.pow(latest.height / 100, 2)
    : null
  const bmiInfo = bmi ? bmiLabel(bmi) : null

  // TDEE calculation
  const tdeeWeight = parseFloat(weight) || latest?.weight || 0
  const tdeeHeight = parseFloat(height) || latest?.height || 0
  const tdeeAgeN   = parseInt(tdeeAge) || 30
  const actFactor  = ACTIVITY_LEVELS.find((a) => a.id === tdeeActivity)?.factor ?? 1.55
  const bmr        = tdeeWeight && tdeeHeight ? calcBMR(tdeeWeight, tdeeHeight, tdeeAgeN, tdeeGender) : 0
  const tdee       = Math.round(bmr * actFactor)
  const goalCalories = tdee
    ? tdeeGoal === 'cut' ? tdee - 500 : tdeeGoal === 'bulk' ? tdee + 300 : tdee
    : 0

  const InputField = ({ label, value, onChange, unit, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; unit: string; placeholder?: string
  }) => (
    <div>
      <label className="text-xs text-forge-white/40 block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className="w-full bg-forge-black border border-forge-border rounded-xl px-3 py-2.5 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-forge-white/30">{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-forge-white/50 hover:text-forge-white transition-colors p-1">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="font-display text-3xl text-gradient-forge">MI CUERPO</h1>
          <p className="text-forge-white/40 text-xs">
            {measurements.length} registros · actualizado hoy
          </p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="mx-4 mb-5">
        <div className="flex bg-forge-iron rounded-xl p-1 gap-1">
          {([
            { id: 'stats', label: 'Medidas',   icon: Scale    },
            { id: 'chart', label: 'Evolución', icon: TrendingUp },
            { id: 'tdee',  label: 'Calorías',  icon: Zap      },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === id ? 'bg-forge-orange text-white shadow' : 'text-forge-white/40'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STATS TAB ───────────────────────────────── */}
        {tab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-4 flex flex-col gap-4">

            {/* Current stats summary */}
            {latest && (
              <div className="grid grid-cols-2 gap-3">
                {latest.weight && (
                  <div className="card-metal p-4">
                    <Scale size={18} className="text-forge-orange mb-2" />
                    <div className="font-mono text-2xl font-bold text-forge-white">{latest.weight}<span className="text-sm text-forge-white/40 ml-1">kg</span></div>
                    <div className="text-xs text-forge-white/40 mt-0.5">Peso corporal</div>
                  </div>
                )}
                {bmi && bmiInfo && (
                  <div className="card-metal p-4">
                    <Activity size={18} className="text-forge-orange mb-2" />
                    <div className="font-mono text-2xl font-bold text-forge-white">{bmi.toFixed(1)}</div>
                    <div className="text-xs mt-0.5 font-semibold" style={{ color: bmiInfo.color }}>{bmiInfo.label}</div>
                  </div>
                )}
                {latest.height && (
                  <div className="card-metal p-4">
                    <Ruler size={18} className="text-forge-orange mb-2" />
                    <div className="font-mono text-2xl font-bold text-forge-white">{latest.height}<span className="text-sm text-forge-white/40 ml-1">cm</span></div>
                    <div className="text-xs text-forge-white/40 mt-0.5">Altura</div>
                  </div>
                )}
                {latest.bodyFat && (
                  <div className="card-metal p-4">
                    <TrendingUp size={18} className="text-forge-orange mb-2" />
                    <div className="font-mono text-2xl font-bold text-forge-white">{latest.bodyFat}<span className="text-sm text-forge-white/40 ml-1">%</span></div>
                    <div className="text-xs text-forge-white/40 mt-0.5">Grasa corporal</div>
                  </div>
                )}
              </div>
            )}

            {/* Circumferences */}
            {latest && (latest.waist || latest.chest || latest.arms || latest.hips) && (
              <div className="card-metal p-4">
                <h3 className="text-xs text-forge-white/40 uppercase tracking-wider mb-3">Circunferencias</h3>
                <div className="grid grid-cols-2 gap-y-3">
                  {[
                    { label: 'Cintura', val: latest.waist },
                    { label: 'Pecho',   val: latest.chest },
                    { label: 'Brazos',  val: latest.arms  },
                    { label: 'Cadera',  val: latest.hips  },
                  ].filter((r) => r.val).map((row) => (
                    <div key={row.label}>
                      <span className="text-forge-white/40 text-xs">{row.label}</span>
                      <div className="font-mono font-bold text-forge-white">{row.val} <span className="text-xs text-forge-white/30">cm</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add measurement form */}
            <div className="card-metal p-4">
              <div className="flex items-center gap-2 mb-4">
                <Plus size={16} className="text-forge-orange" />
                <h3 className="font-semibold text-forge-white text-sm">Registrar medidas de hoy</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <InputField label="Peso"           value={weight}  onChange={setWeight}  unit="kg" />
                <InputField label="Altura"         value={height}  onChange={setHeight}  unit="cm" />
                <InputField label="Grasa corporal" value={bodyFat} onChange={setBodyFat} unit="%" />
                <InputField label="Cintura"        value={waist}   onChange={setWaist}   unit="cm" />
                <InputField label="Pecho"          value={chest}   onChange={setChest}   unit="cm" />
                <InputField label="Brazo (bícep)"  value={arms}    onChange={setArms}    unit="cm" />
                <InputField label="Cadera"         value={hips}    onChange={setHips}    unit="cm" />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || saved || (!weight && !height)}
                className="w-full btn-forge py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saved
                  ? <><CheckCircle size={16} /> Guardado</>
                  : saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Plus size={16} /> Guardar registro</>
                }
              </button>
            </div>
          </motion.div>
        )}

        {/* ── CHART TAB ───────────────────────────────── */}
        {tab === 'chart' && (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 flex flex-col gap-4">
            {weightHistory.length < 2 ? (
              <div className="card-metal p-8 text-center">
                <TrendingUp size={40} className="text-forge-white/10 mx-auto mb-3" />
                <p className="text-forge-white/40 text-sm">Registra al menos 2 pesadas</p>
                <p className="text-forge-white/20 text-xs mt-1">para ver la evolución de tu peso</p>
              </div>
            ) : (
              <div className="card-metal p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-forge-white text-sm">Evolución del peso</h3>
                  <span className="text-xs text-forge-white/40">últimos 60 días</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <span className="text-2xl font-bold font-mono text-forge-orange">
                      {weightHistory[weightHistory.length - 1].weight} kg
                    </span>
                  </div>
                  {weightHistory.length >= 2 && (() => {
                    const diff = weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
                    return (
                      <span className={`text-sm font-semibold ${diff < 0 ? 'text-forge-green' : diff > 0 ? 'text-forge-red' : 'text-forge-white/40'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                      </span>
                    )
                  })()}
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#FF6B1A" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FF6B1A" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: 'rgba(245,245,240,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(245,245,240,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#13131A', border: '1px solid #252530', borderRadius: '10px', fontSize: 12, color: '#F0F0EC' }}
                        formatter={(v) => [`${v} kg`, 'Peso']}
                      />
                      <ReferenceLine y={weightHistory[0].weight} stroke="rgba(255,107,26,0.2)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="weight" stroke="#FF6B1A" strokeWidth={2} fill="url(#weightGrad)" dot={{ fill: '#FF6B1A', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Body fat chart */}
            {bodyFatHistory.length >= 2 && (
              <div className="card-metal p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-forge-white text-sm">Grasa corporal</h3>
                  <span className="text-xs font-mono font-bold" style={{ color: '#60A5FA' }}>
                    {bodyFatHistory[bodyFatHistory.length - 1].bodyFat}%
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bodyFatHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: 'rgba(245,245,240,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(245,245,240,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#13131A', border: '1px solid #252530', borderRadius: '10px', fontSize: 12, color: '#F0F0EC' }}
                        formatter={(v) => [`${v}%`, 'Grasa corporal']}
                      />
                      <Area type="monotone" dataKey="bodyFat" stroke="#60A5FA" strokeWidth={2} fill="url(#bfGrad)" dot={{ fill: '#60A5FA', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Circumferences chart */}
            {circumHistory.length >= 2 && (
              <div className="card-metal p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-forge-white text-sm">Circunferencias</h3>
                  <div className="flex gap-3 text-[10px]">
                    <span style={{ color: '#FB923C' }}>— Cintura</span>
                    <span style={{ color: '#4ADE80' }}>— Pecho</span>
                    <span style={{ color: '#C084FC' }}>— Brazo</span>
                  </div>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={circumHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fill: 'rgba(245,245,240,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(245,245,240,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#13131A', border: '1px solid #252530', borderRadius: '10px', fontSize: 12, color: '#F0F0EC' }}
                        formatter={(v, name) => [`${v} cm`, name === 'waist' ? 'Cintura' : name === 'chest' ? 'Pecho' : 'Brazo']}
                      />
                      <Line type="monotone" dataKey="waist" stroke="#FB923C" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="chest" stroke="#4ADE80" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="arms"  stroke="#C084FC" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* History table */}
            {measurements.length > 0 && (
              <div className="card-metal p-4">
                <h3 className="text-xs text-forge-white/40 uppercase tracking-wider mb-3">Registros recientes</h3>
                <div className="flex flex-col gap-2">
                  {measurements.slice(0, 8).map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="text-forge-white/40 text-xs">
                        {new Date(m.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex gap-4">
                        {m.weight && <span className="text-forge-white font-mono">{m.weight} kg</span>}
                        {m.bodyFat && <span className="text-forge-white/50 font-mono text-xs">{m.bodyFat}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TDEE TAB ────────────────────────────────── */}
        {tab === 'tdee' && (
          <motion.div key="tdee" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-4 flex flex-col gap-4">

            <div className="card-metal p-4 flex flex-col gap-3">
              <h3 className="font-semibold text-forge-white text-sm mb-1">Calculadora TDEE</h3>
              <p className="text-xs text-forge-white/30 -mt-1">Total Daily Energy Expenditure (Mifflin-St Jeor)</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-forge-white/40 block mb-1">Edad</label>
                  <input
                    type="number"
                    value={tdeeAge}
                    onChange={(e) => setTdeeAge(e.target.value)}
                    className="w-full bg-forge-black border border-forge-border rounded-xl px-3 py-2.5 text-forge-white text-sm outline-none focus:border-forge-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-forge-white/40 block mb-1">Sexo</label>
                  <div className="flex bg-forge-black border border-forge-border rounded-xl overflow-hidden">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setTdeeGender(g)}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                          tdeeGender === g ? 'bg-forge-orange text-white' : 'text-forge-white/40'
                        }`}
                      >
                        {g === 'male' ? 'Hombre' : 'Mujer'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-forge-white/40 block mb-1">Nivel de actividad</label>
                <div className="flex flex-col gap-1.5">
                  {ACTIVITY_LEVELS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setTdeeActivity(a.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border ${
                        tdeeActivity === a.id
                          ? 'bg-forge-orange/20 border-forge-orange/50 text-forge-white'
                          : 'bg-forge-black border-forge-border text-forge-white/50'
                      }`}
                    >
                      <span className="font-semibold">{a.label}</span>
                      <span className="text-forge-white/30">{a.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-forge-white/40 block mb-1">Objetivo</label>
                <div className="flex gap-1.5">
                  {([
                    { id: 'cut',      label: 'Definir',   color: '#67E8F9' },
                    { id: 'maintain', label: 'Mantener',  color: '#4ADE80' },
                    { id: 'bulk',     label: 'Volumen',   color: '#FF6B1A' },
                  ] as { id: 'cut' | 'maintain' | 'bulk'; label: string; color: string }[]).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setTdeeGoal(g.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        tdeeGoal === g.id
                          ? 'text-white border-transparent'
                          : 'bg-forge-black border-forge-border text-forge-white/40'
                      }`}
                      style={tdeeGoal === g.id ? { backgroundColor: `${g.color}30`, borderColor: `${g.color}60`, color: g.color } : {}}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result */}
            {goalCalories > 0 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card-metal p-5 text-center"
              >
                <p className="text-xs text-forge-white/40 uppercase tracking-wider mb-1">Tu objetivo diario</p>
                <div className="font-display text-6xl text-gradient-forge mb-1">{goalCalories.toLocaleString()}</div>
                <p className="text-forge-white/50 text-sm mb-4">kcal / día</p>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-forge-black rounded-xl p-2">
                    <div className="font-bold text-forge-white">{Math.round(goalCalories * 0.3 / 4)}g</div>
                    <div className="text-forge-white/40">Proteína</div>
                  </div>
                  <div className="bg-forge-black rounded-xl p-2">
                    <div className="font-bold text-forge-white">{Math.round(goalCalories * 0.45 / 4)}g</div>
                    <div className="text-forge-white/40">Carbos</div>
                  </div>
                  <div className="bg-forge-black rounded-xl p-2">
                    <div className="font-bold text-forge-white">{Math.round(goalCalories * 0.25 / 9)}g</div>
                    <div className="text-forge-white/40">Grasas</div>
                  </div>
                </div>

                <p className="text-[10px] text-forge-white/20 mt-3">
                  TDEE base: {tdee.toLocaleString()} kcal · BMR: {Math.round(bmr).toLocaleString()} kcal
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BodyStatsPage
