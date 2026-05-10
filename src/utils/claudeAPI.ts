import type { Routine, QuestionnaireAnswers } from '../types'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined

const EXERCISE_IDS = 'bench_press, squat, deadlift, overhead_press, barbell_row, pull_up, dip, incline_bench, leg_press, lat_pulldown, cable_row, bicep_curl, tricep_pushdown, lateral_raise, face_pull, leg_curl, leg_extension, calf_raise, hip_thrust, crunch, plank, dumbbell_press, romanian_deadlift, push_up, lunge, hammer_curl, skull_crusher, cable_fly, shrug, incline_curl'

interface GenerateRoutineParams {
  goal: string
  days: number
  equipment: string
  level: string
}

export async function generateRoutineWithAI(params: GenerateRoutineParams): Promise<Routine | null> {
  if (!GROQ_KEY) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content: 'Eres el mejor entrenador personal del mundo. Generas rutinas en JSON puro válido. NUNCA uses markdown ni texto fuera del JSON. Solo devuelves UN objeto JSON.',
          },
          {
            role: 'user',
            content: `Crea UNA rutina con estos parámetros:
- Objetivo: ${params.goal}
- Días/semana: ${params.days}
- Equipamiento: ${params.equipment}
- Nivel: ${params.level}

REGLAS:
- exerciseId SOLO de esta lista: ${EXERCISE_IDS}
- difficulty entre 1 y 5
- category solo: push, pull, legs, fullbody, hiit, custom

Formato exacto (sin markdown):
{"id":"ai_1","name":"Nombre rutina","description":"Descripción breve","exercises":[{"exerciseId":"bench_press","sets":4,"reps":"8-10","rest":90}],"frequency":"${params.days}veces/semana","category":"push","difficulty":3,"isAIGenerated":true}`,
          },
        ],
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const routine = JSON.parse(match[0]) as Routine
    routine.id = `ai_${Date.now()}`
    routine.isAIGenerated = true
    return routine
  } catch {
    return null
  }
}

export async function getProgressiveSuggestion(
  exerciseId: string,
  lastWeight: number,
  lastReps: number,
): Promise<string> {
  if (!GROQ_KEY) return `Última vez: ${lastWeight}kg × ${lastReps}. Intenta ${lastWeight + 2.5}kg × ${lastReps}.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 120,
        temperature: 0.5,
        messages: [
          { role: 'user', content: `Ejercicio: ${exerciseId}. Última sesión: ${lastWeight}kg x ${lastReps} reps. Dame una sugerencia breve de sobrecarga progresiva (1-2 frases en español).` },
        ],
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? `Intenta ${lastWeight + 2.5}kg × ${lastReps}.`
  } catch {
    return `Última vez: ${lastWeight}kg × ${lastReps}. Intenta ${lastWeight + 2.5}kg × ${lastReps}.`
  }
}

// ─── Personalized Plan Generation ────────────────────────────────────────────

function buildFallbackPlan(q: Partial<QuestionnaireAnswers>): Routine[] {
  const days = Math.min(Math.max(q.trainingDays ?? 3, 1), 7)
  const injuries = q.injuries ?? []
  const hasKnee = injuries.includes('knee')
  const hasBack = injuries.includes('back')
  const hasElbow = injuries.includes('elbow')
  const hasShoulder = injuries.includes('shoulder')
  const ts = Date.now()

  const diff = q.experience === 'beginner' ? 2 : q.experience === 'intermediate' ? 3 : q.experience === 'advanced' ? 4 : 5
  const sets = q.experience === 'beginner' ? 3 : 4

  const push = [
    { exerciseId: 'bench_press', sets, reps: '8-10', rest: 90 },
    ...(hasShoulder ? [] : [{ exerciseId: 'overhead_press', sets, reps: '8-10', rest: 90 }]),
    { exerciseId: 'incline_bench', sets: sets - 1, reps: '10-12', rest: 75 },
    ...(hasElbow ? [] : [{ exerciseId: 'tricep_pushdown', sets: sets - 1, reps: '12-15', rest: 60 }]),
    { exerciseId: 'lateral_raise', sets: sets - 1, reps: '12-15', rest: 60 },
  ]

  const pull = [
    ...(hasBack ? [] : [{ exerciseId: 'barbell_row', sets, reps: '8-10', rest: 90 }]),
    { exerciseId: 'lat_pulldown', sets, reps: '10-12', rest: 75 },
    { exerciseId: 'cable_row', sets: sets - 1, reps: '10-12', rest: 75 },
    { exerciseId: 'face_pull', sets: sets - 1, reps: '15-20', rest: 60 },
    { exerciseId: 'bicep_curl', sets: sets - 1, reps: '12-15', rest: 60 },
  ]

  const legs = [
    ...(hasKnee ? [] : [{ exerciseId: 'squat', sets, reps: '6-8', rest: 120 }]),
    ...(hasBack ? [] : [{ exerciseId: 'romanian_deadlift', sets, reps: '10-12', rest: 90 }]),
    ...(hasKnee ? [] : [{ exerciseId: 'leg_press', sets: sets - 1, reps: '12-15', rest: 90 }]),
    { exerciseId: 'hip_thrust', sets, reps: '12-15', rest: 75 },
    { exerciseId: 'calf_raise', sets: sets - 1, reps: '15-20', rest: 45 },
  ]

  const fullBody = [
    ...(hasBack ? [] : [{ exerciseId: 'deadlift', sets: 3, reps: '5-6', rest: 150 }]),
    ...(hasKnee ? [] : [{ exerciseId: 'squat', sets: 3, reps: '8-10', rest: 120 }]),
    { exerciseId: 'bench_press', sets: 3, reps: '8-10', rest: 90 },
    ...(hasBack ? [{ exerciseId: 'lat_pulldown', sets: 3, reps: '10-12', rest: 75 }] : [{ exerciseId: 'barbell_row', sets: 3, reps: '8-10', rest: 90 }]),
    { exerciseId: 'plank', sets: 3, reps: '45s', rest: 60 },
  ]

  const freq = `${days}veces/semana`
  const mk = (id: number, name: string, desc: string, exs: typeof push, cat: Routine['category']): Routine => ({
    id: `ai_${ts}_${id}`, name, description: desc, exercises: exs.filter(e => e.exerciseId), frequency: freq, category: cat, difficulty: diff as Routine['difficulty'], isAIGenerated: true,
  })

  if (days <= 2) {
    return [
      mk(1, 'Full Body A', 'Cuerpo completo — Sesión A', fullBody, 'fullbody'),
      mk(2, 'Full Body B', 'Cuerpo completo — Sesión B', [...pull.slice(0, 3), ...legs.slice(0, 2)], 'fullbody'),
    ].slice(0, days)
  }
  if (days === 3) {
    return [
      mk(1, 'Push — Empuje', 'Pecho, hombros y tríceps', push, 'push'),
      mk(2, 'Pull — Tirón', 'Espalda y bíceps', pull, 'pull'),
      mk(3, 'Legs — Piernas', 'Cuádriceps, isquios y glúteos', legs, 'legs'),
    ]
  }
  if (days === 4) {
    return [
      mk(1, 'Upper A — Empuje', 'Tren superior énfasis pecho', push, 'push'),
      mk(2, 'Lower A — Cuádriceps', 'Tren inferior énfasis frontal', legs, 'legs'),
      mk(3, 'Upper B — Tirón', 'Tren superior énfasis espalda', pull, 'pull'),
      mk(4, 'Lower B — Posterior', 'Glúteos e isquiotibiales', [...legs.slice(1), { exerciseId: 'lunge', sets: 3, reps: '12/lado', rest: 60 }], 'legs'),
    ]
  }
  const base = [
    mk(1, 'Push A', 'Empuje — Volumen alto', push, 'push'),
    mk(2, 'Pull A', 'Tirón — Volumen alto', pull, 'pull'),
    mk(3, 'Legs A', 'Piernas — Sesión A', legs, 'legs'),
    mk(4, 'Push B', 'Empuje — Fuerza', push.slice(0, 4), 'push'),
    mk(5, 'Pull B', 'Tirón — Fuerza', pull.slice(0, 4), 'pull'),
    mk(6, 'Legs B', 'Piernas — Sesión B', [...legs.slice(0, 3), { exerciseId: 'lunge', sets: 3, reps: '10/lado', rest: 60 }], 'legs'),
  ]
  return base.slice(0, days)
}

export async function generatePersonalizedPlan(params: {
  questionnaire: Partial<QuestionnaireAnswers>
  name?: string
  apiKey: string
}): Promise<Routine[]> {
  const { questionnaire: q, name, apiKey } = params
  if (!apiKey) return buildFallbackPlan(q)

  const days = Math.min(Math.max(q.trainingDays ?? 3, 1), 7)
  const injuries = q.injuries ?? []
  const injuriesText = injuries.length > 0
    ? `Dolores/lesiones activas: ${injuries.map(i => ({ back: 'espalda', knee: 'rodilla', hip: 'cadera', elbow: 'codo', shoulder: 'hombro', wrist: 'muñeca' })[i] ?? i).join(', ')}. OMITE ejercicios que carguen esas zonas.`
    : 'Sin lesiones conocidas.'
  const duration = q.sessionDuration ?? 60
  const setsHint = duration <= 30 ? '8-12 series totales' : duration <= 45 ? '12-16 series' : duration <= 60 ? '16-20 series' : '20-26 series'

  const systemPrompt = `Eres el mejor entrenador personal del mundo. Tu única función es generar planes de entrenamiento en JSON puro válido. NUNCA uses markdown, NUNCA añadas texto fuera del JSON. Solo devuelves un array JSON.`

  const userPrompt = `Crea EXACTAMENTE ${days} rutinas de entrenamiento personalizadas para este atleta.

PERFIL COMPLETO:
- Nombre: ${name ?? 'Atleta'} | Sexo: ${q.sex === 'male' ? 'Masculino' : q.sex === 'female' ? 'Femenino' : 'No especificado'}
- Edad: ${q.age ?? 25} años | Peso actual: ${q.weight ?? 70} kg
- Objetivo: ${q.goal ?? 'muscle'} | Motivación: ${q.motivation ?? 'discipline'}
- Nivel: ${q.experience ?? 'beginner'} | Equipamiento: ${q.equipment ?? 'gym'}
- Días/semana: ${days} | Duración por sesión: ${duration} min (${setsHint})
- ${injuriesText}

REGLAS OBLIGATORIAS:
1. Array con EXACTAMENTE ${days} objetos
2. exerciseId SOLO de esta lista: bench_press, squat, deadlift, overhead_press, barbell_row, pull_up, dip, incline_bench, leg_press, lat_pulldown, cable_row, bicep_curl, tricep_pushdown, lateral_raise, face_pull, leg_curl, leg_extension, calf_raise, hip_thrust, crunch, plank, dumbbell_press, romanian_deadlift, push_up, lunge, hammer_curl, skull_crusher, cable_fly, shrug, incline_curl
3. difficulty entre 1 y 5 según nivel del atleta
4. category solo: push, pull, legs, fullbody, hiit o custom

Formato exacto del array (sin markdown, sin texto extra):
[{"id":"ai_1","name":"Nombre rutina","description":"Descripción breve","exercises":[{"exerciseId":"bench_press","sets":4,"reps":"8-10","rest":90}],"frequency":"${days}veces/semana","category":"push","difficulty":3,"isAIGenerated":true}]`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!response.ok) return buildFallbackPlan(q)
    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return buildFallbackPlan(q)
    const routines = JSON.parse(match[0]) as Routine[]
    if (!Array.isArray(routines) || routines.length === 0) return buildFallbackPlan(q)
    return routines.map((r, i) => ({ ...r, id: `ai_${Date.now()}_${i}`, isAIGenerated: true }))
  } catch {
    return buildFallbackPlan(q)
  }
}
