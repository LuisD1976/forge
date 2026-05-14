import type { Routine } from '../types'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined

export type TrainingType = 'gym' | 'home' | 'noequip' | 'outdoor'
export type TrainingGoal = 'burn' | 'muscle' | 'endurance' | 'mobility' | 'cardio' | 'legs' | 'recovery' | 'ai'

export interface AIExerciseCard {
  exerciseId: string
  intensity: 'Baja' | 'Media' | 'Alta' | 'Extrema'
  setsReps: string
  calories: number
  badges: string[]
  tip: string
}

export interface SmartWorkoutContent {
  headline: string
  subtitle: string
  accentColor: string
  secondaryColor: string
  exercises: AIExerciseCard[]
  routine: Routine
  tips: string[]
  totalCalories: number
  estimatedMinutes: number
}

// ── Per-exercise rich metadata ────────────────────────────────────────────────
const EXERCISE_META: Record<string, {
  caloriesPerSet: number
  intensity: AIExerciseCard['intensity']
  badges: string[]
  tip: string
  setsReps: string
}> = {
  bench_press:       { caloriesPerSet: 18, intensity: 'Alta',    badges: ['Compuesto', 'Pecho'],       tip: 'Pies en el suelo, espalda arqueada natural.',         setsReps: '4×8-10'   },
  squat:             { caloriesPerSet: 25, intensity: 'Alta',    badges: ['Compuesto', 'Piernas'],      tip: 'Rodillas alineadas, pecho arriba en todo momento.',   setsReps: '4×8-12'   },
  deadlift:          { caloriesPerSet: 30, intensity: 'Extrema', badges: ['Compuesto', 'Full Body'],    tip: 'Espalda recta, barra pegada al cuerpo siempre.',       setsReps: '4×5-6'    },
  overhead_press:    { caloriesPerSet: 20, intensity: 'Alta',    badges: ['Compuesto', 'Hombros'],      tip: 'Core activado, no arquees la zona lumbar.',            setsReps: '4×8-10'   },
  barbell_row:       { caloriesPerSet: 22, intensity: 'Alta',    badges: ['Compuesto', 'Espalda'],      tip: 'Jala con los codos hacia atrás, no con las manos.',   setsReps: '4×8-10'   },
  pull_up:           { caloriesPerSet: 20, intensity: 'Alta',    badges: ['Calistenia', 'Espalda'],     tip: 'Activa el dorsal antes de tirar del cuerpo.',         setsReps: '4×máx'    },
  dip:               { caloriesPerSet: 15, intensity: 'Media',   badges: ['Calistenia', 'Pecho'],       tip: 'Inclinado = pecho, erguido = tríceps.',               setsReps: '3×12-15'  },
  incline_bench:     { caloriesPerSet: 16, intensity: 'Media',   badges: ['Compuesto', 'Pecho Alto'],   tip: '30-45° para mayor activación clavicular.',            setsReps: '3×10-12'  },
  leg_press:         { caloriesPerSet: 22, intensity: 'Media',   badges: ['Máquina', 'Cuádriceps'],     tip: 'No bloquees las rodillas al extender.',               setsReps: '4×12-15'  },
  lat_pulldown:      { caloriesPerSet: 15, intensity: 'Media',   badges: ['Máquina', 'Espalda'],        tip: 'Jala hasta la clavícula, codos al suelo.',            setsReps: '4×10-12'  },
  cable_row:         { caloriesPerSet: 14, intensity: 'Media',   badges: ['Cable', 'Espalda'],          tip: 'Torso erguido durante todo el movimiento.',           setsReps: '3×12-15'  },
  bicep_curl:        { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Aislamiento', 'Bíceps'],     tip: 'Codos fijos, no uses impulso del torso.',             setsReps: '3×12-15'  },
  tricep_pushdown:   { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Cable', 'Tríceps'],          tip: 'Codos pegados al cuerpo, extensión completa.',        setsReps: '3×12-15'  },
  lateral_raise:     { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Aislamiento', 'Hombros'],    tip: 'Eleva hasta la altura del hombro, no más.',           setsReps: '3×15-20'  },
  face_pull:         { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Cable', 'Manguito'],         tip: 'Jala hacia la cara con los codos altos.',             setsReps: '3×15-20'  },
  leg_curl:          { caloriesPerSet: 12, intensity: 'Baja',    badges: ['Máquina', 'Isquios'],        tip: 'Contracción máxima en posición final.',               setsReps: '3×12-15'  },
  leg_extension:     { caloriesPerSet: 12, intensity: 'Baja',    badges: ['Máquina', 'Cuádriceps'],     tip: 'Extensión completa, contrae el cuád arriba.',         setsReps: '3×15-20'  },
  calf_raise:        { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Aislamiento', 'Gemelos'],    tip: 'Rango completo, pausa 1s en la parte alta.',          setsReps: '4×20-25'  },
  hip_thrust:        { caloriesPerSet: 18, intensity: 'Media',   badges: ['Glúteos', 'Compuesto'],      tip: 'Empuja con los talones, contrae glúteos arriba.',     setsReps: '4×12-15'  },
  crunch:            { caloriesPerSet: 6,  intensity: 'Baja',    badges: ['Core', 'Abdominales'],       tip: 'Acorta la distancia costillas-cadera, no el cuello.', setsReps: '3×20-25'  },
  plank:             { caloriesPerSet: 8,  intensity: 'Media',   badges: ['Core', 'Estático'],          tip: 'Cuerpo en línea recta, respira profundo y constante.',setsReps: '3×45-60s' },
  dumbbell_press:    { caloriesPerSet: 16, intensity: 'Media',   badges: ['Mancuerna', 'Pecho'],        tip: 'Mayor rango de movimiento que la barra.',             setsReps: '3×10-12'  },
  romanian_deadlift: { caloriesPerSet: 20, intensity: 'Media',   badges: ['Bisagra', 'Isquios'],        tip: 'Siente el estiramiento en isquios al bajar.',         setsReps: '3×10-12'  },
  push_up:           { caloriesPerSet: 12, intensity: 'Media',   badges: ['Calistenia', 'Pecho'],       tip: 'Core activado, pecho al suelo en cada rep.',          setsReps: '3×15-20'  },
  lunge:             { caloriesPerSet: 15, intensity: 'Media',   badges: ['Funcional', 'Piernas'],      tip: 'Rodilla trasera casi toca el suelo, torso erguido.',  setsReps: '3×12/lado'},
  hammer_curl:       { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Mancuerna', 'Bíceps'],       tip: 'Agarre neutro, trabaja el braquial y antebrazo.',     setsReps: '3×12-15'  },
  skull_crusher:     { caloriesPerSet: 10, intensity: 'Media',   badges: ['Barra', 'Tríceps'],          tip: 'Codos apuntando al techo, baja a la frente.',         setsReps: '3×10-12'  },
  cable_fly:         { caloriesPerSet: 12, intensity: 'Baja',    badges: ['Cable', 'Pecho'],            tip: 'Movimiento de abrazo, no de press.',                  setsReps: '3×12-15'  },
  shrug:             { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Aislamiento', 'Trapecio'],   tip: 'Encoge los hombros verticalmente, sin rotarlos.',     setsReps: '3×15-20'  },
  incline_curl:      { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Mancuerna', 'Bíceps'],       tip: 'Estiramiento total del bíceps en la posición baja.',  setsReps: '3×12-15'  },
}

// ── Combination data ──────────────────────────────────────────────────────────
type CombKey = `${TrainingType}_${TrainingGoal}`

interface CombData {
  headline: string
  subtitle: string
  accentColor: string
  secondaryColor: string
  exerciseIds: string[]
  routineTemplate: Omit<Routine, 'id'>
  tips: string[]
}

const COMBINATIONS: Record<string, CombData> = {
  // ── GYM ──
  gym_burn: {
    headline: '🔥 HIIT Gym — Quema Total',
    subtitle: 'Circuitos metabólicos de alta intensidad',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['squat', 'deadlift', 'pull_up', 'push_up', 'hip_thrust', 'lunge', 'crunch', 'plank'],
    routineTemplate: {
      name: 'HIIT Gym — Quema Total', description: 'Circuito metabólico de alta intensidad para quemar grasa en el gym',
      exercises: [
        { exerciseId: 'squat',     sets: 4, reps: '15-20',  rest: 45 },
        { exerciseId: 'deadlift',  sets: 3, reps: '10-12',  rest: 60 },
        { exerciseId: 'pull_up',   sets: 3, reps: '10-12',  rest: 45 },
        { exerciseId: 'hip_thrust',sets: 4, reps: '15',     rest: 45 },
        { exerciseId: 'lunge',     sets: 3, reps: '12/lado',rest: 45 },
        { exerciseId: 'plank',     sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '3-4veces/semana', category: 'hiit', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Descansa máx 45s entre ejercicios', 'Mantén la frecuencia cardíaca elevada', 'Hidratación constante durante el circuito'],
  },

  gym_muscle: {
    headline: '💪 Hipertrofia Máxima',
    subtitle: 'Sobrecarga progresiva · Push Pull Legs',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['bench_press', 'squat', 'deadlift', 'barbell_row', 'overhead_press', 'lat_pulldown', 'incline_bench', 'cable_fly'],
    routineTemplate: {
      name: 'Push — Hipertrofia', description: 'Pecho, hombros y tríceps con énfasis en hipertrofia',
      exercises: [
        { exerciseId: 'bench_press',     sets: 4, reps: '8-10',  rest: 90 },
        { exerciseId: 'incline_bench',   sets: 3, reps: '10-12', rest: 75 },
        { exerciseId: 'overhead_press',  sets: 4, reps: '8-10',  rest: 90 },
        { exerciseId: 'cable_fly',       sets: 3, reps: '12-15', rest: 60 },
        { exerciseId: 'lateral_raise',   sets: 3, reps: '15-20', rest: 60 },
        { exerciseId: 'tricep_pushdown', sets: 3, reps: '12-15', rest: 60 },
      ],
      frequency: '4-5veces/semana', category: 'push', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Progresión de carga cada 1-2 semanas', 'Come 2g proteína/kg de peso corporal', 'Prioriza el sueño para máxima recuperación'],
  },

  gym_endurance: {
    headline: '⚡ Resistencia Total Gym',
    subtitle: 'Volumen alto · Rep range 15-25',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['squat', 'barbell_row', 'push_up', 'pull_up', 'lunge', 'hip_thrust', 'crunch', 'plank'],
    routineTemplate: {
      name: 'Resistencia Full Body', description: 'Entrenamiento de resistencia muscular con alto volumen',
      exercises: [
        { exerciseId: 'squat',    sets: 4, reps: '20-25',  rest: 60 },
        { exerciseId: 'push_up',  sets: 4, reps: '20-25',  rest: 45 },
        { exerciseId: 'pull_up',  sets: 4, reps: '12-15',  rest: 60 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 45 },
        { exerciseId: 'hip_thrust',sets:3, reps: '20',     rest: 45 },
        { exerciseId: 'plank',    sets: 3, reps: '60s',    rest: 30 },
      ],
      frequency: '3-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Descansa poco para mantener la resistencia', 'Aumenta reps antes que peso', 'Cronometra tu descanso'],
  },

  gym_mobility: {
    headline: '🧘 Movilidad & Flexibilidad',
    subtitle: 'Mejora tu rango de movimiento',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['hip_thrust', 'lunge', 'calf_raise', 'face_pull', 'lateral_raise', 'plank', 'romanian_deadlift', 'leg_curl'],
    routineTemplate: {
      name: 'Movilidad Activa', description: 'Sesión de movilidad y activación muscular profunda',
      exercises: [
        { exerciseId: 'hip_thrust',       sets: 3, reps: '15',     rest: 60 },
        { exerciseId: 'lunge',            sets: 3, reps: '12/lado', rest: 45 },
        { exerciseId: 'face_pull',        sets: 3, reps: '20',     rest: 45 },
        { exerciseId: 'romanian_deadlift',sets: 3, reps: '12',     rest: 60 },
        { exerciseId: 'lateral_raise',    sets: 3, reps: '15',     rest: 45 },
        { exerciseId: 'plank',            sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '2-3veces/semana', category: 'custom', difficulty: 2, isAIGenerated: true,
    },
    tips: ['Movimientos lentos y controlados', 'Siente cada estiramiento sin rebote', 'Ideal como calentamiento o día de descanso activo'],
  },

  gym_cardio: {
    headline: '❤️ Cardio & Funcional Gym',
    subtitle: 'Máquinas + ejercicios compuestos',
    accentColor: '#FB923C', secondaryColor: '#F97316',
    exerciseIds: ['squat', 'lunge', 'hip_thrust', 'push_up', 'pull_up', 'crunch', 'plank', 'dip'],
    routineTemplate: {
      name: 'Cardio Funcional Gym', description: 'Sesión cardiovascular con ejercicios funcionales de alta intensidad',
      exercises: [
        { exerciseId: 'squat',    sets: 3, reps: '20',     rest: 30 },
        { exerciseId: 'push_up',  sets: 3, reps: '20',     rest: 30 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 30 },
        { exerciseId: 'pull_up',  sets: 3, reps: '10',     rest: 45 },
        { exerciseId: 'hip_thrust',sets:3, reps: '20',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '3-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Descanso mínimo entre ejercicios', 'Mantén el ritmo cardíaco elevado', 'Perfecto para días de cardio activo'],
  },

  gym_legs: {
    headline: '🦵 Día de Piernas Brutal',
    subtitle: 'Cuádriceps · Isquios · Glúteos',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'leg_press', 'romanian_deadlift', 'leg_curl', 'leg_extension', 'hip_thrust', 'calf_raise', 'lunge'],
    routineTemplate: {
      name: 'Piernas — Volumen Total', description: 'Día completo de piernas con énfasis en hipertrofia',
      exercises: [
        { exerciseId: 'squat',            sets: 4, reps: '8-10',  rest: 120 },
        { exerciseId: 'leg_press',        sets: 4, reps: '12-15', rest: 90  },
        { exerciseId: 'romanian_deadlift',sets: 3, reps: '10-12', rest: 90  },
        { exerciseId: 'leg_curl',         sets: 3, reps: '12-15', rest: 75  },
        { exerciseId: 'leg_extension',    sets: 3, reps: '15-20', rest: 60  },
        { exerciseId: 'hip_thrust',       sets: 4, reps: '12-15', rest: 75  },
        { exerciseId: 'calf_raise',       sets: 4, reps: '20-25', rest: 45  },
      ],
      frequency: '1-2veces/semana', category: 'legs', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Calienta bien las rodillas antes', 'Sentadilla como ejercicio principal', 'Prioriza la recuperación post-piernas'],
  },

  gym_recovery: {
    headline: '🛡 Recuperación Activa',
    subtitle: 'Trabajo ligero para acelerar la recuperación',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['face_pull', 'lateral_raise', 'plank', 'calf_raise', 'cable_row', 'hip_thrust', 'crunch', 'romanian_deadlift'],
    routineTemplate: {
      name: 'Recuperación Activa', description: 'Sesión ligera de recuperación y activación',
      exercises: [
        { exerciseId: 'face_pull',    sets: 3, reps: '20',  rest: 60 },
        { exerciseId: 'lateral_raise',sets: 3, reps: '15-20',rest: 45},
        { exerciseId: 'cable_row',    sets: 3, reps: '15',  rest: 60 },
        { exerciseId: 'hip_thrust',   sets: 3, reps: '15',  rest: 60 },
        { exerciseId: 'plank',        sets: 3, reps: '45s', rest: 45 },
        { exerciseId: 'calf_raise',   sets: 3, reps: '20',  rest: 45 },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 2, isAIGenerated: true,
    },
    tips: ['Cargas al 50-60% del máximo', 'Enfócate en la técnica perfecta', 'Añade estiramiento de 10 min al final'],
  },

  // ── HOME ──
  home_burn: {
    headline: '🏠🔥 HIIT en Casa',
    subtitle: 'Sin equipo · Quema calórica máxima',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['push_up', 'squat', 'lunge', 'plank', 'crunch', 'hip_thrust', 'dip', 'pull_up'],
    routineTemplate: {
      name: 'HIIT Casa — Quema Total', description: 'Circuito de alta intensidad en casa sin equipamiento',
      exercises: [
        { exerciseId: 'push_up',  sets: 4, reps: '15-20',  rest: 30 },
        { exerciseId: 'squat',    sets: 4, reps: '20-25',  rest: 30 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 30 },
        { exerciseId: 'hip_thrust',sets:3, reps: '20',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
        { exerciseId: 'crunch',   sets: 3, reps: '20-25',  rest: 30 },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Descansos cortos de 30s', 'Puedes hacerlo en cualquier espacio', 'Aumenta reps para más intensidad'],
  },

  home_muscle: {
    headline: '🏠💪 Fuerza en Casa',
    subtitle: 'Mancuernas + calistenia + progresión',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['push_up', 'pull_up', 'dip', 'squat', 'hip_thrust', 'dumbbell_press', 'hammer_curl', 'skull_crusher'],
    routineTemplate: {
      name: 'Fuerza Casa — Upper', description: 'Tren superior con peso corporal y mancuernas',
      exercises: [
        { exerciseId: 'push_up',      sets: 4, reps: '12-15', rest: 75 },
        { exerciseId: 'pull_up',      sets: 4, reps: '8-10',  rest: 90 },
        { exerciseId: 'dip',          sets: 3, reps: '10-12', rest: 75 },
        { exerciseId: 'dumbbell_press',sets:3, reps: '10-12', rest: 75 },
        { exerciseId: 'hammer_curl',  sets: 3, reps: '12-15', rest: 60 },
        { exerciseId: 'skull_crusher',sets: 3, reps: '10-12', rest: 60 },
      ],
      frequency: '3-4veces/semana', category: 'push', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Progresa con variantes más difíciles', 'Añade peso a las dominadas si puedes', 'Mantén la tensión muscular'],
  },

  home_cardio: {
    headline: '🏠❤️ Cardio en Casa',
    subtitle: 'Quema calorías sin salir de casa',
    accentColor: '#FB923C', secondaryColor: '#F97316',
    exerciseIds: ['push_up', 'squat', 'lunge', 'plank', 'crunch', 'hip_thrust', 'pull_up', 'dip'],
    routineTemplate: {
      name: 'Cardio Casero', description: 'Circuito cardiovascular en casa',
      exercises: [
        { exerciseId: 'squat',    sets: 4, reps: '20',     rest: 30 },
        { exerciseId: 'push_up',  sets: 3, reps: '15-20',  rest: 30 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 30 },
        { exerciseId: 'hip_thrust',sets:3, reps: '20',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Muévete sin parar para elevar el ritmo', 'Añade música motivadora', '30-40 minutos es suficiente'],
  },

  home_legs: {
    headline: '🏠🦵 Piernas en Casa',
    subtitle: 'Peso corporal + variaciones avanzadas',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'lunge', 'hip_thrust', 'calf_raise', 'romanian_deadlift', 'leg_curl', 'plank', 'crunch'],
    routineTemplate: {
      name: 'Piernas Casa — Completo', description: 'Entrenamiento completo de piernas en casa',
      exercises: [
        { exerciseId: 'squat',            sets: 5, reps: '15-20',  rest: 60 },
        { exerciseId: 'lunge',            sets: 4, reps: '12/lado', rest: 60 },
        { exerciseId: 'hip_thrust',       sets: 4, reps: '15-20',  rest: 60 },
        { exerciseId: 'romanian_deadlift',sets: 3, reps: '12-15',  rest: 60 },
        { exerciseId: 'calf_raise',       sets: 4, reps: '25-30',  rest: 45 },
      ],
      frequency: '2veces/semana', category: 'legs', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Sentadilla búlgara para más intensidad', 'Una pierna si es muy fácil', 'Peso corporal puede ser más que suficiente'],
  },

  home_mobility: {
    headline: '🏠🧘 Movilidad en Casa',
    subtitle: 'Flexibilidad y activación diaria',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['lunge', 'hip_thrust', 'calf_raise', 'plank', 'crunch', 'squat', 'romanian_deadlift', 'push_up'],
    routineTemplate: {
      name: 'Movilidad & Activación Casa', description: 'Rutina de movilidad para hacer en casa cada mañana',
      exercises: [
        { exerciseId: 'lunge',    sets: 3, reps: '10/lado', rest: 30 },
        { exerciseId: 'hip_thrust',sets:3, reps: '15',     rest: 30 },
        { exerciseId: 'squat',    sets: 3, reps: '15',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 30 },
        { exerciseId: 'calf_raise',sets:3, reps: '20',     rest: 30 },
      ],
      frequency: 'diario', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Ideal para empezar el día', 'Movimientos lentos y conscientes', 'Agrega estiramiento de 5 min al terminar'],
  },

  home_endurance: {
    headline: '🏠⚡ Resistencia en Casa',
    subtitle: 'Alto volumen · Músculos de acero',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['push_up', 'squat', 'lunge', 'hip_thrust', 'plank', 'crunch', 'pull_up', 'dip'],
    routineTemplate: {
      name: 'Resistencia Casa', description: 'Entrenamiento de resistencia de alto volumen en casa',
      exercises: [
        { exerciseId: 'push_up',  sets: 5, reps: '20-25',  rest: 45 },
        { exerciseId: 'squat',    sets: 5, reps: '25-30',  rest: 45 },
        { exerciseId: 'lunge',    sets: 4, reps: '15/lado', rest: 45 },
        { exerciseId: 'pull_up',  sets: 4, reps: '12-15',  rest: 60 },
        { exerciseId: 'plank',    sets: 4, reps: '60s',    rest: 30 },
        { exerciseId: 'hip_thrust',sets:4, reps: '20',     rest: 45 },
      ],
      frequency: '4-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Descansos cortos para mantener resistencia', 'Entrena por tiempo si quieres más intensidad', 'Aumenta sets con el tiempo'],
  },

  home_recovery: {
    headline: '🏠🛡 Recuperación en Casa',
    subtitle: 'Activa la circulación, descansa los músculos',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['plank', 'hip_thrust', 'lunge', 'calf_raise', 'crunch', 'push_up'],
    routineTemplate: {
      name: 'Recuperación Activa Casa', description: 'Sesión suave de recuperación en casa',
      exercises: [
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 60 },
        { exerciseId: 'hip_thrust',sets:3, reps: '15',     rest: 60 },
        { exerciseId: 'lunge',    sets: 3, reps: '10/lado', rest: 60 },
        { exerciseId: 'calf_raise',sets:3, reps: '20',     rest: 45 },
        { exerciseId: 'crunch',   sets: 3, reps: '15',     rest: 45 },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Muy ligero, sin esfuerzo máximo', 'Perfecto el día después de piernas', 'Agrega 10 min de estiramiento'],
  },

  // ── NO EQUIPMENT ──
  noequip_burn: {
    headline: '🚫🔥 HIIT Sin Pesas',
    subtitle: 'Calistenia explosiva · Quema sin equipo',
    accentColor: '#FBBF24', secondaryColor: '#F59E0B',
    exerciseIds: ['push_up', 'squat', 'lunge', 'plank', 'crunch', 'hip_thrust', 'pull_up', 'dip'],
    routineTemplate: {
      name: 'HIIT Calistenia Quema', description: 'Circuito HIIT con solo peso corporal',
      exercises: [
        { exerciseId: 'squat',    sets: 4, reps: '20-25',  rest: 30 },
        { exerciseId: 'push_up',  sets: 4, reps: '15-20',  rest: 30 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 30 },
        { exerciseId: 'pull_up',  sets: 3, reps: '8-12',   rest: 45 },
        { exerciseId: 'hip_thrust',sets:3, reps: '25',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['No necesitas nada más que tu cuerpo', 'Velocidad + control = más quema', 'Descanso mínimo entre circuitos'],
  },

  noequip_muscle: {
    headline: '🚫💪 Calistenia & Fuerza',
    subtitle: 'Progresiones de peso corporal',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['push_up', 'pull_up', 'dip', 'squat', 'lunge', 'hip_thrust', 'plank', 'crunch'],
    routineTemplate: {
      name: 'Calistenia Fuerza', description: 'Fuerza y músculo con solo peso corporal',
      exercises: [
        { exerciseId: 'pull_up',  sets: 4, reps: '6-8',   rest: 120 },
        { exerciseId: 'push_up',  sets: 5, reps: '12-15', rest: 90  },
        { exerciseId: 'dip',      sets: 4, reps: '10-12', rest: 90  },
        { exerciseId: 'squat',    sets: 4, reps: '15-20', rest: 60  },
        { exerciseId: 'hip_thrust',sets:4, reps: '15',    rest: 60  },
        { exerciseId: 'plank',    sets: 3, reps: '60s',   rest: 45  },
      ],
      frequency: '3-4veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Progresa a variantes más difíciles', 'Dominadas lastradas cuando sea fácil', 'Calistenia = fuerza funcional real'],
  },

  noequip_cardio: {
    headline: '🚫❤️ Cardio Corporal',
    subtitle: 'Sin equipo · Ritmo cardíaco alto',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['squat', 'push_up', 'lunge', 'hip_thrust', 'plank', 'crunch', 'pull_up', 'dip'],
    routineTemplate: {
      name: 'Cardio Sin Equipo', description: 'Sesión cardio intensa con peso corporal',
      exercises: [
        { exerciseId: 'squat',    sets: 4, reps: '20',     rest: 20 },
        { exerciseId: 'push_up',  sets: 4, reps: '15',     rest: 20 },
        { exerciseId: 'lunge',    sets: 4, reps: '15/lado', rest: 20 },
        { exerciseId: 'hip_thrust',sets:3, reps: '20',     rest: 20 },
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 20 },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Tabata: 20s trabajo / 10s descanso', 'Sin excusas: solo necesitas tu cuerpo', 'Velocidad constante para más quema'],
  },

  noequip_legs: {
    headline: '🚫🦵 Piernas Sin Equipo',
    subtitle: 'Cuádriceps y glúteos de hierro',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'lunge', 'hip_thrust', 'calf_raise', 'plank', 'crunch'],
    routineTemplate: {
      name: 'Piernas Calistenia', description: 'Piernas completas sin ningún equipo',
      exercises: [
        { exerciseId: 'squat',    sets: 5, reps: '20-25',  rest: 60 },
        { exerciseId: 'lunge',    sets: 4, reps: '15/lado', rest: 60 },
        { exerciseId: 'hip_thrust',sets:4, reps: '20',     rest: 60 },
        { exerciseId: 'calf_raise',sets:4, reps: '30',     rest: 45 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '2-3veces/semana', category: 'legs', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Sentadilla búlgara para más dificultad', 'Hip thrust con mochila con peso', 'Una pierna = triple de intensidad'],
  },

  noequip_endurance: {
    headline: '🚫⚡ Resistencia Calistenia',
    subtitle: 'Volumen extremo · Solo cuerpo',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['push_up', 'squat', 'lunge', 'pull_up', 'hip_thrust', 'plank', 'crunch', 'dip'],
    routineTemplate: {
      name: 'Resistencia Calistenia', description: 'Entrenamiento de resistencia con peso corporal',
      exercises: [
        { exerciseId: 'push_up',  sets: 5, reps: '20-25',  rest: 45 },
        { exerciseId: 'squat',    sets: 5, reps: '25-30',  rest: 45 },
        { exerciseId: 'pull_up',  sets: 4, reps: '10-15',  rest: 60 },
        { exerciseId: 'lunge',    sets: 4, reps: '15/lado', rest: 45 },
        { exerciseId: 'plank',    sets: 4, reps: '60s',    rest: 30 },
        { exerciseId: 'dip',      sets: 3, reps: '15-20',  rest: 45 },
      ],
      frequency: '4-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['El límite es tu cabeza, no tus músculos', 'Aumenta reps cada semana', '100 flexiones en 5 min = nivel élite'],
  },

  noequip_mobility: {
    headline: '🚫🧘 Movilidad Calistenia',
    subtitle: 'Flexibilidad total sin equipo',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['lunge', 'squat', 'hip_thrust', 'plank', 'crunch', 'push_up'],
    routineTemplate: {
      name: 'Movilidad Sin Equipo', description: 'Sesión de movilidad y flexibilidad con peso corporal',
      exercises: [
        { exerciseId: 'lunge',    sets: 3, reps: '10/lado', rest: 30 },
        { exerciseId: 'squat',    sets: 3, reps: '15',     rest: 30 },
        { exerciseId: 'hip_thrust',sets:3, reps: '15',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 30 },
        { exerciseId: 'push_up',  sets: 3, reps: '10',     rest: 30 },
      ],
      frequency: 'diario', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Movimientos lentos y controlados', 'Perfecto para empezar el día', 'Combina con yoga para mejores resultados'],
  },

  noequip_recovery: {
    headline: '🚫🛡 Recuperación Activa',
    subtitle: 'Descanso inteligente · Cuerpo libre',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['plank', 'lunge', 'hip_thrust', 'crunch', 'push_up', 'squat'],
    routineTemplate: {
      name: 'Recuperación Calistenia', description: 'Sesión suave de recuperación con peso corporal',
      exercises: [
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 60 },
        { exerciseId: 'lunge',    sets: 3, reps: '8/lado',  rest: 60 },
        { exerciseId: 'hip_thrust',sets:3, reps: '12',     rest: 60 },
        { exerciseId: 'push_up',  sets: 3, reps: '8-10',   rest: 60 },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Muy ligero para activar sin fatigar', 'Ideal para días de descanso activo', 'Suma 10 min de caminata suave'],
  },

  // ── OUTDOOR ──
  outdoor_cardio: {
    headline: '🌳❤️ Cardio Outdoor',
    subtitle: 'Running · Sprints · Circuitos exteriores',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['squat', 'lunge', 'push_up', 'pull_up', 'plank', 'crunch', 'hip_thrust', 'dip'],
    routineTemplate: {
      name: 'Circuito Outdoor Cardio', description: 'Circuito exterior para resistencia y cardio',
      exercises: [
        { exerciseId: 'squat',    sets: 4, reps: '20',     rest: 30 },
        { exerciseId: 'push_up',  sets: 3, reps: '15-20',  rest: 30 },
        { exerciseId: 'pull_up',  sets: 3, reps: '8-10',   rest: 45 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 30 },
        { exerciseId: 'dip',      sets: 3, reps: '12',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '3-4veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Combina con 20-30 min de carrera', 'Usa el parque como tu gym', 'Barras de calistenia = tu mejor herramienta'],
  },

  outdoor_burn: {
    headline: '🌳🔥 Quema Outdoor',
    subtitle: 'Circuitos de alta intensidad al aire libre',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['squat', 'lunge', 'push_up', 'pull_up', 'hip_thrust', 'dip', 'crunch', 'plank'],
    routineTemplate: {
      name: 'HIIT Outdoor Quema', description: 'Circuito quema calorías en exteriores',
      exercises: [
        { exerciseId: 'squat',    sets: 4, reps: '20-25',  rest: 30 },
        { exerciseId: 'push_up',  sets: 4, reps: '15-20',  rest: 30 },
        { exerciseId: 'pull_up',  sets: 3, reps: '8-12',   rest: 45 },
        { exerciseId: 'lunge',    sets: 3, reps: '15/lado', rest: 30 },
        { exerciseId: 'hip_thrust',sets:3, reps: '20',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Empieza con 10 min de carrera suave', 'El aire fresco aumenta el rendimiento', 'Sprints entre circuitos para más quema'],
  },

  outdoor_muscle: {
    headline: '🌳💪 Fuerza Outdoor',
    subtitle: 'Calistenia en el parque · Fuerza real',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['pull_up', 'push_up', 'dip', 'squat', 'lunge', 'hip_thrust', 'plank'],
    routineTemplate: {
      name: 'Fuerza Outdoor', description: 'Entrenamiento de fuerza en exteriores con barras',
      exercises: [
        { exerciseId: 'pull_up',  sets: 5, reps: '6-8',   rest: 120 },
        { exerciseId: 'dip',      sets: 4, reps: '10-12', rest: 90  },
        { exerciseId: 'push_up',  sets: 4, reps: '12-15', rest: 75  },
        { exerciseId: 'squat',    sets: 4, reps: '15-20', rest: 60  },
        { exerciseId: 'hip_thrust',sets:4, reps: '15',    rest: 60  },
        { exerciseId: 'plank',    sets: 3, reps: '60s',   rest: 45  },
      ],
      frequency: '3-4veces/semana', category: 'fullbody', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Busca barras en el parque cercano', 'Dominadas ponderadas para progresar', 'Calistenia construye fuerza funcional real'],
  },

  outdoor_endurance: {
    headline: '🌳⚡ Resistencia Outdoor',
    subtitle: 'Parque como gym · Resistencia total',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['squat', 'push_up', 'pull_up', 'lunge', 'hip_thrust', 'plank', 'crunch', 'dip'],
    routineTemplate: {
      name: 'Resistencia Outdoor', description: 'Circuito de resistencia al aire libre',
      exercises: [
        { exerciseId: 'push_up',  sets: 5, reps: '20',     rest: 30 },
        { exerciseId: 'pull_up',  sets: 4, reps: '10-12',  rest: 45 },
        { exerciseId: 'squat',    sets: 4, reps: '25',     rest: 30 },
        { exerciseId: 'lunge',    sets: 4, reps: '15/lado', rest: 30 },
        { exerciseId: 'dip',      sets: 3, reps: '15',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '60s',    rest: 30 },
      ],
      frequency: '4-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Combina con carrera para resistencia total', 'Entrena por tiempo para más intensidad', 'El terreno irregular aumenta la dificultad'],
  },

  outdoor_legs: {
    headline: '🌳🦵 Piernas Outdoor',
    subtitle: 'Sentadillas y estocadas al aire libre',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'lunge', 'hip_thrust', 'calf_raise', 'plank', 'crunch'],
    routineTemplate: {
      name: 'Piernas Outdoor', description: 'Entrenamiento de piernas al aire libre',
      exercises: [
        { exerciseId: 'squat',    sets: 5, reps: '20-25',  rest: 60 },
        { exerciseId: 'lunge',    sets: 4, reps: '15/lado', rest: 60 },
        { exerciseId: 'hip_thrust',sets:4, reps: '20',     rest: 60 },
        { exerciseId: 'calf_raise',sets:4, reps: '30',     rest: 45 },
        { exerciseId: 'plank',    sets: 3, reps: '45s',    rest: 30 },
      ],
      frequency: '2-3veces/semana', category: 'legs', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Escaleras del parque = perfectas para gemelos', 'Sentadilla búlgara en banco del parque', 'Sprint de 100m para calentar'],
  },

  outdoor_mobility: {
    headline: '🌳🧘 Movilidad Outdoor',
    subtitle: 'Flexibilidad al aire libre · Mente y cuerpo',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['lunge', 'squat', 'hip_thrust', 'plank', 'crunch', 'push_up'],
    routineTemplate: {
      name: 'Movilidad Outdoor', description: 'Sesión de movilidad y bienestar al aire libre',
      exercises: [
        { exerciseId: 'lunge',    sets: 3, reps: '10/lado', rest: 30 },
        { exerciseId: 'squat',    sets: 3, reps: '15',     rest: 30 },
        { exerciseId: 'hip_thrust',sets:3, reps: '15',     rest: 30 },
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 30 },
        { exerciseId: 'push_up',  sets: 3, reps: '10',     rest: 30 },
      ],
      frequency: 'diario', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['El aire fresco mejora el estado mental', 'Combina con caminata matutina', 'Ideal para empezar el día con energía'],
  },

  outdoor_recovery: {
    headline: '🌳🛡 Recuperación Outdoor',
    subtitle: 'Caminata activa + movilidad en el parque',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['plank', 'lunge', 'hip_thrust', 'crunch', 'push_up', 'squat'],
    routineTemplate: {
      name: 'Recuperación Outdoor', description: 'Sesión suave de recuperación al aire libre',
      exercises: [
        { exerciseId: 'lunge',    sets: 3, reps: '8/lado',  rest: 60 },
        { exerciseId: 'hip_thrust',sets:3, reps: '12',     rest: 60 },
        { exerciseId: 'plank',    sets: 3, reps: '30s',    rest: 60 },
        { exerciseId: 'push_up',  sets: 3, reps: '8',      rest: 60 },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['30 min de caminata es suficiente', 'El sol y el aire aceleran la recuperación', 'Combina con respiración profunda'],
  },
}

// ── Content builder ───────────────────────────────────────────────────────────
function buildStaticContent(type: TrainingType, goal: TrainingGoal): SmartWorkoutContent {
  const key: CombKey = `${type}_${goal}`
  const comb: CombData = (COMBINATIONS[key] as CombData | undefined) ?? (COMBINATIONS['gym_muscle'] as CombData)

  const exercises: AIExerciseCard[] = comb.exerciseIds
    .map(id => {
      const meta = EXERCISE_META[id]
      if (!meta) return null
      const sets = parseInt(meta.setsReps[0]) || 3
      return { exerciseId: id, intensity: meta.intensity, setsReps: meta.setsReps, calories: meta.caloriesPerSet * sets, badges: meta.badges, tip: meta.tip }
    })
    .filter(Boolean) as AIExerciseCard[]

  const totalCalories = exercises.reduce((t, e) => t + e.calories, 0)
  const estimatedMinutes = comb.routineTemplate.exercises.length * 9 + 15

  return {
    headline: comb.headline,
    subtitle: comb.subtitle,
    accentColor: comb.accentColor,
    secondaryColor: comb.secondaryColor,
    exercises,
    routine: { ...comb.routineTemplate, id: `smart_${type}_${goal}` },
    tips: comb.tips,
    totalCalories,
    estimatedMinutes,
  }
}

// ── AI content generation via GROQ ───────────────────────────────────────────
const VALID_EXERCISE_IDS = Object.keys(EXERCISE_META).join(', ')

const cache = new Map<string, SmartWorkoutContent>()

export async function generateSmartContent(
  type: TrainingType,
  goal: TrainingGoal,
): Promise<SmartWorkoutContent> {
  const cacheKey = `${type}_${goal}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const staticContent = buildStaticContent(type, goal)

  if (!GROQ_KEY) return staticContent

  const typeLabels: Record<TrainingType, string> = {
    gym: 'Gimnasio (con todo el equipamiento)',
    home: 'En casa (mancuernas básicas y bandas)',
    noequip: 'Sin equipamiento (solo peso corporal)',
    outdoor: 'Exterior (parque, barras callejeras)',
  }
  const goalLabels: Record<TrainingGoal, string> = {
    burn: 'Quemar grasa al máximo',
    muscle: 'Aumentar músculo / hipertrofia',
    endurance: 'Resistencia muscular',
    mobility: 'Movilidad y flexibilidad',
    cardio: 'Cardio y resistencia cardiovascular',
    legs: 'Especialización en piernas',
    recovery: 'Recuperación activa',
    ai: 'Personalizado con IA',
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1800,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: 'Eres el mejor entrenador personal del mundo. Generas contenido de entrenamiento en JSON puro válido. NUNCA uses markdown. Solo JSON.',
          },
          {
            role: 'user',
            content: `Genera contenido de entrenamiento personalizado para:
- Lugar/equipo: ${typeLabels[type]}
- Objetivo: ${goalLabels[goal]}

Devuelve EXACTAMENTE este JSON (sin markdown):
{
  "headline": "emoji + título motivador corto",
  "subtitle": "subtítulo descriptivo",
  "exercises": [
    { "exerciseId": "bench_press", "intensity": "Alta", "setsReps": "4×8-10", "calories": 72, "badges": ["Compuesto","Pecho"], "tip": "consejo breve" }
  ],
  "routine": {
    "name": "nombre rutina",
    "description": "descripción breve",
    "exercises": [{ "exerciseId": "bench_press", "sets": 4, "reps": "8-10", "rest": 90 }],
    "frequency": "3-4veces/semana",
    "category": "push",
    "difficulty": 4,
    "isAIGenerated": true
  },
  "tips": ["tip1", "tip2", "tip3"]
}

REGLAS:
- exerciseId SOLO de: ${VALID_EXERCISE_IDS}
- intensity solo: Baja, Media, Alta, Extrema
- category solo: push, pull, legs, fullbody, hiit, custom
- 6-8 ejercicios en exercises
- 5-7 ejercicios en routine.exercises`,
          },
        ],
      }),
    })

    if (!res.ok) return staticContent
    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return staticContent

    const parsed = JSON.parse(match[0])
    const content: SmartWorkoutContent = {
      headline: parsed.headline ?? staticContent.headline,
      subtitle: parsed.subtitle ?? staticContent.subtitle,
      accentColor: staticContent.accentColor,
      secondaryColor: staticContent.secondaryColor,
      exercises: (parsed.exercises ?? staticContent.exercises).map((e: AIExerciseCard) => ({
        ...e,
        exerciseId: EXERCISE_META[e.exerciseId] ? e.exerciseId : staticContent.exercises[0]?.exerciseId ?? 'push_up',
      })),
      routine: {
        ...(parsed.routine ?? staticContent.routine),
        id: `ai_smart_${type}_${goal}_${Date.now()}`,
        isAIGenerated: true,
      },
      tips: parsed.tips ?? staticContent.tips,
      totalCalories: staticContent.totalCalories,
      estimatedMinutes: staticContent.estimatedMinutes,
    }

    cache.set(cacheKey, content)
    return content
  } catch {
    return staticContent
  }
}

export function getExerciseMeta(exerciseId: string) {
  return EXERCISE_META[exerciseId]
}
