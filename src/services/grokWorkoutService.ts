import type { Routine } from '../types'

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

// ── Exercise metadata ─────────────────────────────────────────────────────────
// caloriesPerSet: kcal quemadas por serie/bloque (estimación realista)
const EXERCISE_META: Record<string, {
  caloriesPerSet: number
  intensity: AIExerciseCard['intensity']
  badges: string[]
  tip: string
  setsReps: string
}> = {
  // ── Barbell / Gym compound ──────────────────────────────────────────────────
  bench_press:       { caloriesPerSet: 18, intensity: 'Alta',    badges: ['Compuesto', 'Pecho'],       tip: 'Pies en el suelo, espalda arqueada natural.',         setsReps: '4×8-10'   },
  squat:             { caloriesPerSet: 25, intensity: 'Alta',    badges: ['Compuesto', 'Piernas'],      tip: 'Rodillas alineadas con los pies en todo momento.',    setsReps: '4×8-12'   },
  deadlift:          { caloriesPerSet: 30, intensity: 'Extrema', badges: ['Compuesto', 'Full Body'],    tip: 'Espalda recta, barra pegada al cuerpo siempre.',       setsReps: '4×5-6'    },
  overhead_press:    { caloriesPerSet: 20, intensity: 'Alta',    badges: ['Compuesto', 'Hombros'],      tip: 'Core activado, no arquees la zona lumbar.',            setsReps: '4×8-10'   },
  barbell_row:       { caloriesPerSet: 22, intensity: 'Alta',    badges: ['Compuesto', 'Espalda'],      tip: 'Jala con los codos hacia atrás, no con las manos.',   setsReps: '4×8-10'   },
  incline_bench:     { caloriesPerSet: 16, intensity: 'Media',   badges: ['Compuesto', 'Pecho Alto'],   tip: '30-45° para mayor activación clavicular.',            setsReps: '3×10-12'  },
  romanian_deadlift: { caloriesPerSet: 20, intensity: 'Media',   badges: ['Bisagra', 'Isquios'],        tip: 'Siente el estiramiento en isquios al bajar.',         setsReps: '3×10-12'  },
  skull_crusher:     { caloriesPerSet: 10, intensity: 'Media',   badges: ['Barra', 'Tríceps'],          tip: 'Codos apuntando al techo, baja a la frente.',         setsReps: '3×10-12'  },
  shrug:             { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Aislamiento', 'Trapecio'],   tip: 'Encoge los hombros verticalmente, sin rotarlos.',     setsReps: '3×15-20'  },
  bicep_curl:        { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Aislamiento', 'Bíceps'],     tip: 'Codos fijos, no uses impulso del torso.',             setsReps: '3×12-15'  },
  hip_thrust:        { caloriesPerSet: 18, intensity: 'Media',   badges: ['Glúteos', 'Compuesto'],      tip: 'Empuja con los talones, contrae glúteos arriba.',     setsReps: '4×12-15'  },
  // ── Gym machines ────────────────────────────────────────────────────────────
  leg_press:         { caloriesPerSet: 22, intensity: 'Media',   badges: ['Máquina', 'Cuádriceps'],     tip: 'No bloquees las rodillas al extender.',               setsReps: '4×12-15'  },
  leg_curl:          { caloriesPerSet: 12, intensity: 'Baja',    badges: ['Máquina', 'Isquios'],        tip: 'Contracción máxima en posición final.',               setsReps: '3×12-15'  },
  leg_extension:     { caloriesPerSet: 12, intensity: 'Baja',    badges: ['Máquina', 'Cuádriceps'],     tip: 'Extensión completa, contrae el cuád arriba.',         setsReps: '3×15-20'  },
  lat_pulldown:      { caloriesPerSet: 15, intensity: 'Media',   badges: ['Máquina', 'Espalda'],        tip: 'Jala hasta la clavícula, codos al suelo.',            setsReps: '4×10-12'  },
  cable_row:         { caloriesPerSet: 14, intensity: 'Media',   badges: ['Cable', 'Espalda'],          tip: 'Torso erguido durante todo el movimiento.',           setsReps: '3×12-15'  },
  tricep_pushdown:   { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Cable', 'Tríceps'],          tip: 'Codos pegados al cuerpo, extensión completa.',        setsReps: '3×12-15'  },
  face_pull:         { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Cable', 'Manguito'],         tip: 'Jala hacia la cara con los codos altos.',             setsReps: '3×15-20'  },
  cable_fly:         { caloriesPerSet: 12, intensity: 'Baja',    badges: ['Cable', 'Pecho'],            tip: 'Movimiento de abrazo, no de press.',                  setsReps: '3×12-15'  },
  calf_raise:        { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Aislamiento', 'Gemelos'],    tip: 'Rango completo, pausa 1s en la parte alta.',          setsReps: '4×20-25'  },
  lateral_raise:     { caloriesPerSet: 8,  intensity: 'Baja',    badges: ['Aislamiento', 'Hombros'],    tip: 'Eleva hasta la altura del hombro, no más.',           setsReps: '3×15-20'  },
  // ── Gym cardio machines ──────────────────────────────────────────────────────
  treadmill_incline: { caloriesPerSet: 110, intensity: 'Media',  badges: ['Cardio', 'Quema Grasa'],     tip: 'Inclinación 8-12%, velocidad 5-6 km/h, 15 minutos.', setsReps: '1×15min'  },
  rowing_machine:    { caloriesPerSet: 40,  intensity: 'Alta',   badges: ['Cardio', 'Full Body'],       tip: 'Tira con las piernas primero, luego el torso, luego los brazos.', setsReps: '4×500m' },
  // ── Dumbbell ────────────────────────────────────────────────────────────────
  dumbbell_press:    { caloriesPerSet: 16, intensity: 'Media',   badges: ['Mancuerna', 'Pecho'],        tip: 'Mayor rango de movimiento que la barra.',             setsReps: '3×10-12'  },
  hammer_curl:       { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Mancuerna', 'Bíceps'],       tip: 'Agarre neutro, trabaja el braquial y antebrazo.',     setsReps: '3×12-15'  },
  incline_curl:      { caloriesPerSet: 10, intensity: 'Baja',    badges: ['Mancuerna', 'Bíceps'],       tip: 'Estiramiento total del bíceps en la posición baja.',  setsReps: '3×12-15'  },
  // ── Bodyweight compound ──────────────────────────────────────────────────────
  pull_up:           { caloriesPerSet: 20, intensity: 'Alta',    badges: ['Calistenia', 'Espalda'],     tip: 'Activa el dorsal antes de tirar del cuerpo.',         setsReps: '4×máx'    },
  dip:               { caloriesPerSet: 15, intensity: 'Media',   badges: ['Calistenia', 'Pecho'],       tip: 'Inclinado = pecho, erguido = tríceps.',               setsReps: '3×12-15'  },
  push_up:           { caloriesPerSet: 12, intensity: 'Media',   badges: ['Calistenia', 'Pecho'],       tip: 'Core activado, pecho al suelo en cada rep.',          setsReps: '4×15-20'  },
  lunge:             { caloriesPerSet: 15, intensity: 'Media',   badges: ['Funcional', 'Piernas'],      tip: 'Rodilla trasera casi toca el suelo, torso erguido.',  setsReps: '3×12/lado'},
  plank:             { caloriesPerSet: 8,  intensity: 'Media',   badges: ['Core', 'Estático'],          tip: 'Cuerpo en línea recta, respira profundo y constante.',setsReps: '3×45-60s' },
  crunch:            { caloriesPerSet: 6,  intensity: 'Baja',    badges: ['Core', 'Abdominales'],       tip: 'Acorta la distancia costillas-cadera, no el cuello.', setsReps: '3×20-25'  },
  // ── HIIT / Cardio bodyweight ─────────────────────────────────────────────────
  burpee:            { caloriesPerSet: 26, intensity: 'Extrema', badges: ['HIIT', 'Full Body'],         tip: 'Controla la caída, no te desplomes al bajar.',        setsReps: '3×12-15'  },
  jumping_jack:      { caloriesPerSet: 7,  intensity: 'Baja',    badges: ['Cardio', 'Calentamiento'],   tip: 'Mantén el ritmo constante para elevar el cardio.',    setsReps: '3×45s'    },
  mountain_climber:  { caloriesPerSet: 14, intensity: 'Alta',    badges: ['HIIT', 'Core'],              tip: 'Caderas abajo, alterna las rodillas rápido.',         setsReps: '4×30s'    },
  high_knee:         { caloriesPerSet: 11, intensity: 'Media',   badges: ['Cardio', 'Piernas'],         tip: 'Levanta las rodillas por encima de la cadera.',       setsReps: '4×30s'    },
  jump_squat:        { caloriesPerSet: 18, intensity: 'Alta',    badges: ['HIIT', 'Piernas'],           tip: 'Aterriza suave con las rodillas ligeramente flexas.',  setsReps: '3×15-20'  },
  box_jump:          { caloriesPerSet: 20, intensity: 'Alta',    badges: ['Potencia', 'Piernas'],       tip: 'Aterriza con toda la planta del pie y absorbe el impacto.', setsReps: '4×8-10'},
  bear_crawl:        { caloriesPerSet: 15, intensity: 'Alta',    badges: ['Funcional', 'Core'],         tip: 'Caderas al nivel del torso, pasos cortos y controlados.', setsReps: '3×20m'  },
  sprint:            { caloriesPerSet: 22, intensity: 'Extrema', badges: ['Cardio', 'Potencia'],        tip: 'Máxima velocidad los primeros 10 metros.',            setsReps: '6×30m'    },
  stair_climb:       { caloriesPerSet: 20, intensity: 'Media',   badges: ['Cardio', 'Piernas'],         tip: 'Sube de dos en dos para más activación de glúteos.',  setsReps: '5×2min'   },
  // ── Bodyweight strength ──────────────────────────────────────────────────────
  glute_bridge:      { caloriesPerSet: 9,  intensity: 'Baja',    badges: ['Glúteos', 'Sin Equipo'],     tip: 'Eleva la cadera hasta alinear rodillas-cadera-hombros.', setsReps: '4×20'  },
  russian_twist:     { caloriesPerSet: 7,  intensity: 'Media',   badges: ['Core', 'Oblicuos'],          tip: 'Rota el torso, no los brazos.',                       setsReps: '3×20'     },
  wall_sit:          { caloriesPerSet: 10, intensity: 'Media',   badges: ['Isometría', 'Cuádriceps'],   tip: '90° de rodilla, espalda completamente pegada a la pared.', setsReps: '3×45s'},
  superman:          { caloriesPerSet: 5,  intensity: 'Baja',    badges: ['Espalda', 'Glúteos'],        tip: 'Eleva brazos y piernas al mismo tiempo, contrae glúteos.', setsReps: '3×15' },
  step_up:           { caloriesPerSet: 12, intensity: 'Media',   badges: ['Funcional', 'Piernas'],      tip: 'Pisa el escalón con el talón completo, no en punta.',  setsReps: '3×12/lado'},
  inchworm:          { caloriesPerSet: 8,  intensity: 'Media',   badges: ['Movilidad', 'Full Body'],    tip: 'Camina con las manos lento, siente el estiramiento.',  setsReps: '3×8'      },
  // ── Mobility ────────────────────────────────────────────────────────────────
  hip_circle:        { caloriesPerSet: 3,  intensity: 'Baja',    badges: ['Movilidad', 'Cadera'],       tip: 'Círculos grandes y lentos, siente la articulación.',   setsReps: '2×10/lado'},
  cat_cow:           { caloriesPerSet: 3,  intensity: 'Baja',    badges: ['Movilidad', 'Columna'],      tip: 'Sincroniza respiración: inhala vaca, exhala gato.',    setsReps: '3×10'     },
  pigeon_stretch:    { caloriesPerSet: 2,  intensity: 'Baja',    badges: ['Estiramiento', 'Cadera'],    tip: 'Mantén la posición 30-60s, respira profundo.',         setsReps: '2×45s/l.'},
  world_stretch:     { caloriesPerSet: 5,  intensity: 'Baja',    badges: ['Movilidad', 'Full Body'],    tip: 'Abre la cadera al máximo en cada repetición.',         setsReps: '2×8/lado' },
  shoulder_rotation: { caloriesPerSet: 2,  intensity: 'Baja',    badges: ['Movilidad', 'Hombros'],      tip: 'Círculos amplios hacia adelante y hacia atrás.',       setsReps: '2×10/lado'},
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
  overrideMinutes?: number
}

const COMBINATIONS: Record<string, CombData> = {

  // ════════════════════════════════════════════════════════════════════════════
  // GYM — tiene acceso a todo el equipamiento
  // ════════════════════════════════════════════════════════════════════════════

  gym_burn: {
    headline: '🔥 HIIT Metabólico — Gym',
    subtitle: 'Máquinas + superseries · Calorías al máximo',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['treadmill_incline', 'rowing_machine', 'squat', 'barbell_row', 'hip_thrust', 'pull_up', 'jump_squat', 'plank'],
    routineTemplate: {
      name: 'HIIT Metabólico — Gym', description: 'Cardio en máquinas + superseries de compound. Alta quema calórica.',
      exercises: [
        { exerciseId: 'treadmill_incline', sets: 1, reps: '15min',   rest: 60  },
        { exerciseId: 'rowing_machine',    sets: 4, reps: '500m',    rest: 60  },
        { exerciseId: 'squat',            sets: 4, reps: '15-20',   rest: 45  },
        { exerciseId: 'barbell_row',      sets: 3, reps: '12-15',   rest: 45  },
        { exerciseId: 'hip_thrust',       sets: 4, reps: '15-20',   rest: 45  },
        { exerciseId: 'jump_squat',       sets: 3, reps: '15',      rest: 30  },
        { exerciseId: 'plank',            sets: 3, reps: '45s',     rest: 30  },
      ],
      frequency: '3-4veces/semana', category: 'hiit', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Descansa máx 45s entre ejercicios del circuito', 'Cinta inclinada al 10-12% de pendiente', 'Combina con déficit calórico moderado para resultados óptimos'],
    overrideMinutes: 55,
  },

  gym_muscle: {
    headline: '💪 Hipertrofia Real — Gym',
    subtitle: 'Sobrecarga progresiva · Compound pesado',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['bench_press', 'squat', 'deadlift', 'barbell_row', 'overhead_press', 'lat_pulldown', 'incline_bench', 'cable_fly'],
    routineTemplate: {
      name: 'Push — Hipertrofia Máxima', description: 'Compound pesado con progresión de carga. Pecho, hombros y tríceps.',
      exercises: [
        { exerciseId: 'bench_press',    sets: 4, reps: '6-8',   rest: 120 },
        { exerciseId: 'squat',          sets: 4, reps: '6-8',   rest: 120 },
        { exerciseId: 'incline_bench',  sets: 3, reps: '8-10',  rest: 90  },
        { exerciseId: 'overhead_press', sets: 4, reps: '8-10',  rest: 90  },
        { exerciseId: 'lat_pulldown',   sets: 4, reps: '8-10',  rest: 90  },
        { exerciseId: 'cable_fly',      sets: 3, reps: '12-15', rest: 60  },
      ],
      frequency: '4-5veces/semana', category: 'push', difficulty: 5, isAIGenerated: true,
    },
    tips: ['Aumenta carga 2.5 kg cada semana o cada dos', 'Come 1.8-2.2g proteína/kg de peso', 'Duerme 7-9h: el músculo crece mientras descansas'],
    overrideMinutes: 75,
  },

  gym_endurance: {
    headline: '⚡ Resistencia Muscular — Gym',
    subtitle: 'Alto volumen · Rep range 15-25 · Poco descanso',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['squat', 'barbell_row', 'lat_pulldown', 'leg_press', 'pull_up', 'lunge', 'hip_thrust', 'plank'],
    routineTemplate: {
      name: 'Resistencia Total — Gym', description: 'Alto volumen con descansos cortos para máxima resistencia muscular.',
      exercises: [
        { exerciseId: 'squat',      sets: 4, reps: '20-25', rest: 60  },
        { exerciseId: 'pull_up',    sets: 4, reps: '12-15', rest: 60  },
        { exerciseId: 'leg_press',  sets: 4, reps: '20-25', rest: 60  },
        { exerciseId: 'barbell_row',sets: 3, reps: '15-20', rest: 45  },
        { exerciseId: 'lunge',      sets: 3, reps: '15/lado',rest: 45 },
        { exerciseId: 'hip_thrust', sets: 3, reps: '20',    rest: 45  },
        { exerciseId: 'plank',      sets: 3, reps: '60s',   rest: 30  },
      ],
      frequency: '3-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Cronometra el descanso: no más de 60s', 'Aumenta reps antes de aumentar peso', 'El circuito completo 2-3 veces = sesión perfecta'],
    overrideMinutes: 60,
  },

  gym_cardio: {
    headline: '❤️ Cardio & Funcional — Gym',
    subtitle: 'Máquinas cardio + circuito funcional',
    accentColor: '#FB923C', secondaryColor: '#F97316',
    exerciseIds: ['treadmill_incline', 'rowing_machine', 'squat', 'lunge', 'pull_up', 'push_up', 'hip_thrust', 'plank'],
    routineTemplate: {
      name: 'Cardio Funcional — Gym', description: 'Alternancia de máquinas cardio y ejercicios funcionales de alta frecuencia.',
      exercises: [
        { exerciseId: 'treadmill_incline', sets: 1, reps: '12min',   rest: 60  },
        { exerciseId: 'rowing_machine',    sets: 3, reps: '500m',    rest: 60  },
        { exerciseId: 'squat',            sets: 3, reps: '20',      rest: 30  },
        { exerciseId: 'pull_up',          sets: 3, reps: '10',      rest: 45  },
        { exerciseId: 'lunge',            sets: 3, reps: '15/lado', rest: 30  },
        { exerciseId: 'plank',            sets: 3, reps: '45s',     rest: 30  },
      ],
      frequency: '3-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Alterna: 10 min máquina → circuito → 10 min máquina', 'Mantén el ritmo cardíaco en zona 3-4 (65-85% FC máx)', 'Perfecto para días de cardio sin sacrificar músculo'],
    overrideMinutes: 50,
  },

  gym_legs: {
    headline: '🦵 Día de Piernas Brutal — Gym',
    subtitle: 'Cuádriceps · Isquios · Glúteos · Gemelos',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'leg_press', 'romanian_deadlift', 'leg_curl', 'leg_extension', 'hip_thrust', 'calf_raise', 'lunge'],
    routineTemplate: {
      name: 'Piernas — Volumen Total', description: 'Día completo de tren inferior. Del cuádriceps al gemelo.',
      exercises: [
        { exerciseId: 'squat',            sets: 5, reps: '6-10',  rest: 120 },
        { exerciseId: 'leg_press',        sets: 4, reps: '12-15', rest: 90  },
        { exerciseId: 'romanian_deadlift',sets: 3, reps: '10-12', rest: 90  },
        { exerciseId: 'leg_curl',         sets: 3, reps: '12-15', rest: 75  },
        { exerciseId: 'leg_extension',    sets: 3, reps: '15-20', rest: 60  },
        { exerciseId: 'hip_thrust',       sets: 4, reps: '12-15', rest: 75  },
        { exerciseId: 'calf_raise',       sets: 5, reps: '20-25', rest: 45  },
      ],
      frequency: '1-2veces/semana', category: 'legs', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Calienta rodillas y caderas 10 min antes', 'Sentadilla como ejercicio central — no la omitas', 'Toma proteína + carbohidratos post-entreno de piernas'],
    overrideMinutes: 80,
  },

  gym_mobility: {
    headline: '🧘 Movilidad Activa — Gym',
    subtitle: 'Rango de movimiento · Recuperación · Flexibilidad',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['hip_circle', 'cat_cow', 'pigeon_stretch', 'world_stretch', 'face_pull', 'inchworm', 'shoulder_rotation', 'romanian_deadlift'],
    routineTemplate: {
      name: 'Movilidad Activa — Gym', description: 'Sesión de movilidad y activación profunda. Ideal como warm-up o día de descanso activo.',
      exercises: [
        { exerciseId: 'hip_circle',        sets: 2, reps: '10/lado', rest: 20  },
        { exerciseId: 'cat_cow',           sets: 3, reps: '10',      rest: 20  },
        { exerciseId: 'inchworm',          sets: 3, reps: '8',       rest: 30  },
        { exerciseId: 'world_stretch',     sets: 2, reps: '8/lado',  rest: 20  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '45s/l.',  rest: 15  },
        { exerciseId: 'face_pull',         sets: 3, reps: '20',      rest: 30  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 15  },
        { exerciseId: 'romanian_deadlift', sets: 3, reps: '12',      rest: 60  },
      ],
      frequency: '2-3veces/semana', category: 'custom', difficulty: 2, isAIGenerated: true,
    },
    tips: ['Movimientos lentos y controlados, sin rebote', 'Respira profundo en cada estiramiento', 'Ideal como calentamiento antes de sentadilla o peso muerto'],
    overrideMinutes: 40,
  },

  gym_recovery: {
    headline: '🛡 Recuperación Activa — Gym',
    subtitle: 'Cargas ligeras · Perfusión muscular · Regeneración',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['face_pull', 'shoulder_rotation', 'cable_row', 'hip_thrust', 'cat_cow', 'plank', 'superman', 'calf_raise'],
    routineTemplate: {
      name: 'Recuperación Activa — Gym', description: 'Trabajo ligero al 50% para acelerar la recuperación sin añadir fatiga.',
      exercises: [
        { exerciseId: 'face_pull',         sets: 3, reps: '20',   rest: 60 },
        { exerciseId: 'cable_row',         sets: 3, reps: '15',   rest: 60 },
        { exerciseId: 'hip_thrust',        sets: 3, reps: '15',   rest: 60 },
        { exerciseId: 'cat_cow',           sets: 3, reps: '12',   rest: 30 },
        { exerciseId: 'plank',             sets: 3, reps: '30s',  rest: 45 },
        { exerciseId: 'superman',          sets: 3, reps: '12',   rest: 45 },
        { exerciseId: 'calf_raise',        sets: 3, reps: '20',   rest: 30 },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 2, isAIGenerated: true,
    },
    tips: ['Cargas al 40-50% del máximo', 'El objetivo es activar, no fatigar', 'Añade 10 min de foam roller al terminar'],
    overrideMinutes: 35,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // HOME — mancuernas básicas + barra dominadas opcional + peso corporal
  // ════════════════════════════════════════════════════════════════════════════

  home_burn: {
    headline: '🏠🔥 HIIT en Casa — Quema Total',
    subtitle: 'Jumping jacks · Burpees · Mountain climbers · Sin equipo',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['jumping_jack', 'mountain_climber', 'burpee', 'high_knee', 'jump_squat', 'push_up', 'lunge', 'plank'],
    routineTemplate: {
      name: 'HIIT Casa — Quema Total', description: 'Circuito de alta intensidad en casa. Cardio puro sin equipo.',
      exercises: [
        { exerciseId: 'jumping_jack',     sets: 3, reps: '45s',    rest: 15  },
        { exerciseId: 'burpee',           sets: 3, reps: '12-15',  rest: 30  },
        { exerciseId: 'mountain_climber', sets: 4, reps: '30s',    rest: 20  },
        { exerciseId: 'high_knee',        sets: 3, reps: '30s',    rest: 15  },
        { exerciseId: 'jump_squat',       sets: 3, reps: '15-20',  rest: 30  },
        { exerciseId: 'push_up',          sets: 3, reps: '15-20',  rest: 30  },
        { exerciseId: 'lunge',            sets: 3, reps: '12/lado',rest: 30  },
        { exerciseId: 'plank',            sets: 3, reps: '45s',    rest: 20  },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Descansa solo 15-30s entre ejercicios para mantener el ritmo cardíaco', 'Calienta 5 min con jumping jacks suaves antes', 'Repite el circuito 2-3 veces para máxima quema'],
    overrideMinutes: 40,
  },

  home_muscle: {
    headline: '🏠💪 Fuerza en Casa — Hipertrofia',
    subtitle: 'Mancuernas + flexiones + progresiones avanzadas',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['push_up', 'dumbbell_press', 'hammer_curl', 'squat', 'hip_thrust', 'glute_bridge', 'lateral_raise', 'step_up'],
    routineTemplate: {
      name: 'Fuerza Casa — Upper Body', description: 'Tren superior con mancuernas y peso corporal. Hipertrofia real en casa.',
      exercises: [
        { exerciseId: 'push_up',      sets: 4, reps: '12-15', rest: 75  },
        { exerciseId: 'dumbbell_press',sets: 4, reps: '10-12', rest: 75  },
        { exerciseId: 'hammer_curl',  sets: 3, reps: '12-15', rest: 60  },
        { exerciseId: 'squat',        sets: 4, reps: '15-20', rest: 60  },
        { exerciseId: 'hip_thrust',   sets: 4, reps: '12-15', rest: 60  },
        { exerciseId: 'lateral_raise',sets: 3, reps: '15-20', rest: 60  },
        { exerciseId: 'glute_bridge', sets: 4, reps: '20',    rest: 45  },
      ],
      frequency: '3-4veces/semana', category: 'push', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Progresa a flexiones con lastre o en declive cuando 15 reps sean fáciles', 'Usa mancuernas más pesadas con 6-8 reps para fuerza', 'La tensión mecánica + el volumen = la clave de la hipertrofia en casa'],
    overrideMinutes: 55,
  },

  home_cardio: {
    headline: '🏠❤️ Cardio en Casa — Circuito',
    subtitle: 'Cardio funcional sin salir · Quema eficiente',
    accentColor: '#FB923C', secondaryColor: '#F97316',
    exerciseIds: ['jumping_jack', 'high_knee', 'mountain_climber', 'squat', 'push_up', 'lunge', 'hip_thrust', 'plank'],
    routineTemplate: {
      name: 'Cardio Casero — Circuito', description: 'Circuito cardiovascular en casa. Sin parar para mantener el ritmo.',
      exercises: [
        { exerciseId: 'jumping_jack',     sets: 3, reps: '45s',    rest: 15  },
        { exerciseId: 'high_knee',        sets: 3, reps: '30s',    rest: 15  },
        { exerciseId: 'mountain_climber', sets: 3, reps: '30s',    rest: 20  },
        { exerciseId: 'squat',            sets: 3, reps: '20',     rest: 30  },
        { exerciseId: 'push_up',          sets: 3, reps: '15',     rest: 30  },
        { exerciseId: 'lunge',            sets: 3, reps: '12/lado',rest: 30  },
        { exerciseId: 'plank',            sets: 3, reps: '45s',    rest: 20  },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['30-40 minutos en zona cardio media quema ~300-400 kcal', 'Añade música de 130-140 BPM para mantener el ritmo', 'No pares: si no puedes más, baja la intensidad pero sigue moviéndote'],
    overrideMinutes: 38,
  },

  home_legs: {
    headline: '🏠🦵 Piernas en Casa — Completo',
    subtitle: 'Peso corporal + mancuernas · Sin máquinas',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'lunge', 'hip_thrust', 'glute_bridge', 'step_up', 'wall_sit', 'calf_raise', 'jump_squat'],
    routineTemplate: {
      name: 'Piernas Casa — Completo', description: 'Tren inferior completo sin gym. Cuádriceps, glúteos, isquios y gemelos.',
      exercises: [
        { exerciseId: 'squat',       sets: 5, reps: '15-20',  rest: 60  },
        { exerciseId: 'lunge',       sets: 4, reps: '12/lado',rest: 60  },
        { exerciseId: 'hip_thrust',  sets: 4, reps: '15-20',  rest: 60  },
        { exerciseId: 'glute_bridge',sets: 4, reps: '20',     rest: 45  },
        { exerciseId: 'step_up',     sets: 3, reps: '12/lado',rest: 60  },
        { exerciseId: 'wall_sit',    sets: 3, reps: '45s',    rest: 45  },
        { exerciseId: 'calf_raise',  sets: 4, reps: '25-30',  rest: 30  },
      ],
      frequency: '2veces/semana', category: 'legs', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Sentadilla búlgara con mancuernas = equivalente al leg press', 'Una pierna (pistol squat) cuando el volumen no sea suficiente', 'Añade peso a las mancuernas para hip thrust para más intensidad'],
    overrideMinutes: 55,
  },

  home_mobility: {
    headline: '🏠🧘 Movilidad en Casa — Morning Flow',
    subtitle: 'Flexibilidad · Activación · Bienestar diario',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['hip_circle', 'cat_cow', 'pigeon_stretch', 'world_stretch', 'inchworm', 'shoulder_rotation', 'glute_bridge', 'superman'],
    routineTemplate: {
      name: 'Morning Flow — Movilidad Casa', description: 'Rutina de movilidad y activación para hacer cada mañana en casa.',
      exercises: [
        { exerciseId: 'hip_circle',        sets: 2, reps: '10/lado', rest: 15  },
        { exerciseId: 'cat_cow',           sets: 3, reps: '10',      rest: 15  },
        { exerciseId: 'inchworm',          sets: 3, reps: '6',       rest: 20  },
        { exerciseId: 'world_stretch',     sets: 2, reps: '6/lado',  rest: 15  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '45s/l.',  rest: 10  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 10  },
        { exerciseId: 'glute_bridge',      sets: 3, reps: '15',      rest: 20  },
        { exerciseId: 'superman',          sets: 3, reps: '12',      rest: 20  },
      ],
      frequency: 'diario', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Ideal a primera hora del día para activar el cuerpo', 'Movimientos lentos y conscientes, no bruscos', 'Combina con 5 min de respiración profunda'],
    overrideMinutes: 28,
  },

  home_endurance: {
    headline: '🏠⚡ Resistencia en Casa — Alto Volumen',
    subtitle: 'Músculos de acero · Sin descanso',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['push_up', 'squat', 'lunge', 'hip_thrust', 'mountain_climber', 'plank', 'crunch', 'glute_bridge'],
    routineTemplate: {
      name: 'Resistencia Casa — Alto Volumen', description: 'Circuito de resistencia muscular con poco descanso.',
      exercises: [
        { exerciseId: 'push_up',          sets: 5, reps: '20-25',  rest: 45  },
        { exerciseId: 'squat',            sets: 5, reps: '25-30',  rest: 45  },
        { exerciseId: 'lunge',            sets: 4, reps: '15/lado',rest: 45  },
        { exerciseId: 'hip_thrust',       sets: 4, reps: '20',     rest: 45  },
        { exerciseId: 'mountain_climber', sets: 3, reps: '30s',    rest: 30  },
        { exerciseId: 'plank',            sets: 4, reps: '60s',    rest: 30  },
        { exerciseId: 'crunch',           sets: 3, reps: '25',     rest: 30  },
      ],
      frequency: '4-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Entrena por tiempo si quieres más intensidad: 40 min seguidos', 'El límite es tu cabeza, no tus músculos', 'Aumenta series con el tiempo, no solo reps'],
    overrideMinutes: 50,
  },

  home_recovery: {
    headline: '🏠🛡 Recuperación en Casa — Suave',
    subtitle: 'Activa la circulación · Relaja los músculos',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['cat_cow', 'hip_circle', 'pigeon_stretch', 'glute_bridge', 'superman', 'shoulder_rotation'],
    routineTemplate: {
      name: 'Recuperación Activa Casa', description: 'Sesión muy ligera para acelerar la recuperación sin añadir fatiga.',
      exercises: [
        { exerciseId: 'cat_cow',           sets: 3, reps: '10',      rest: 20  },
        { exerciseId: 'hip_circle',        sets: 2, reps: '10/lado', rest: 15  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '45s/l.',  rest: 10  },
        { exerciseId: 'glute_bridge',      sets: 3, reps: '15',      rest: 30  },
        { exerciseId: 'superman',          sets: 3, reps: '12',      rest: 30  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 10  },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Muy ligero: no debe sentirse como entrenamiento', 'Perfecto el día después de piernas o entreno intenso', 'Añade 10-15 min de caminata suave'],
    overrideMinutes: 25,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // NOEQUIP — solo peso corporal, sin ningún equipo
  // ════════════════════════════════════════════════════════════════════════════

  noequip_burn: {
    headline: '🚫🔥 HIIT Puro — Sin Nada',
    subtitle: 'Burpees · Sprints · Cardio explosivo · 0 equipo',
    accentColor: '#FBBF24', secondaryColor: '#F59E0B',
    exerciseIds: ['burpee', 'jumping_jack', 'mountain_climber', 'high_knee', 'jump_squat', 'bear_crawl', 'push_up', 'plank'],
    routineTemplate: {
      name: 'HIIT Calistenia — Quema', description: 'Circuito HIIT intenso sin ningún equipo. Solo tu cuerpo.',
      exercises: [
        { exerciseId: 'burpee',           sets: 4, reps: '12-15',  rest: 30  },
        { exerciseId: 'jumping_jack',     sets: 3, reps: '45s',    rest: 15  },
        { exerciseId: 'mountain_climber', sets: 4, reps: '30s',    rest: 15  },
        { exerciseId: 'high_knee',        sets: 3, reps: '30s',    rest: 15  },
        { exerciseId: 'jump_squat',       sets: 3, reps: '15-20',  rest: 30  },
        { exerciseId: 'bear_crawl',       sets: 3, reps: '20m',    rest: 30  },
        { exerciseId: 'push_up',          sets: 3, reps: '15-20',  rest: 30  },
        { exerciseId: 'plank',            sets: 3, reps: '45s',    rest: 20  },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Sin excusas: solo necesitas espacio libre', 'El burpee es el ejercicio más completo que existe', 'Tabata: 20s al máximo / 10s descanso × 8 rondas'],
    overrideMinutes: 35,
  },

  noequip_muscle: {
    headline: '🚫💪 Calistenia — Fuerza Real',
    subtitle: 'Flexiones · Sentadillas · Progresiones avanzadas',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['push_up', 'squat', 'lunge', 'glute_bridge', 'hip_thrust', 'plank', 'crunch', 'superman'],
    routineTemplate: {
      name: 'Calistenia Fuerza', description: 'Fuerza y músculo con solo peso corporal. Progresión constante.',
      exercises: [
        { exerciseId: 'push_up',     sets: 5, reps: '12-15', rest: 90  },
        { exerciseId: 'squat',       sets: 5, reps: '15-20', rest: 75  },
        { exerciseId: 'lunge',       sets: 4, reps: '12/lado',rest: 60 },
        { exerciseId: 'hip_thrust',  sets: 4, reps: '20',    rest: 60  },
        { exerciseId: 'glute_bridge',sets: 4, reps: '20',    rest: 45  },
        { exerciseId: 'plank',       sets: 4, reps: '60s',   rest: 45  },
        { exerciseId: 'superman',    sets: 3, reps: '15',    rest: 30  },
      ],
      frequency: '3-4veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Progresa a flexiones en diamante, declinadas o con una mano', 'Sentadilla pistol cuando las bilaterales sean demasiado fáciles', 'La calistenia desarrolla fuerza funcional y relativa real'],
    overrideMinutes: 50,
  },

  noequip_cardio: {
    headline: '🚫❤️ Cardio Corporal — Sin Equipo',
    subtitle: 'Ritmo cardíaco alto · Solo tu cuerpo',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['jumping_jack', 'high_knee', 'mountain_climber', 'burpee', 'jump_squat', 'push_up', 'lunge', 'plank'],
    routineTemplate: {
      name: 'Cardio Sin Equipo', description: 'Sesión cardio intensa con solo peso corporal.',
      exercises: [
        { exerciseId: 'jumping_jack',     sets: 3, reps: '45s',    rest: 15  },
        { exerciseId: 'high_knee',        sets: 3, reps: '30s',    rest: 15  },
        { exerciseId: 'mountain_climber', sets: 3, reps: '30s',    rest: 20  },
        { exerciseId: 'burpee',           sets: 3, reps: '10-12',  rest: 30  },
        { exerciseId: 'jump_squat',       sets: 3, reps: '15',     rest: 30  },
        { exerciseId: 'lunge',            sets: 3, reps: '12/lado',rest: 30  },
        { exerciseId: 'plank',            sets: 3, reps: '30s',    rest: 20  },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Tabata: 20s de trabajo / 10s descanso, 8 rondas por ejercicio', 'Sin equipo = sin excusas, se puede hacer en cualquier lugar', 'Velocidad constante para más quema calórica'],
    overrideMinutes: 35,
  },

  noequip_legs: {
    headline: '🚫🦵 Piernas — Solo Cuerpo',
    subtitle: 'Cuádriceps y glúteos sin ningún equipo',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'lunge', 'glute_bridge', 'hip_thrust', 'jump_squat', 'wall_sit', 'step_up', 'calf_raise'],
    routineTemplate: {
      name: 'Piernas Calistenia — Sin Equipo', description: 'Tren inferior completo sin ningún equipo.',
      exercises: [
        { exerciseId: 'squat',       sets: 5, reps: '20-25',  rest: 60  },
        { exerciseId: 'lunge',       sets: 4, reps: '15/lado',rest: 60  },
        { exerciseId: 'glute_bridge',sets: 4, reps: '25',     rest: 45  },
        { exerciseId: 'jump_squat',  sets: 3, reps: '15-20',  rest: 45  },
        { exerciseId: 'wall_sit',    sets: 3, reps: '60s',    rest: 45  },
        { exerciseId: 'calf_raise',  sets: 4, reps: '30',     rest: 30  },
      ],
      frequency: '2-3veces/semana', category: 'legs', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Sentadilla búlgara con silla como apoyo', 'Hip thrust con mochila como lastre', 'Una pierna (pistol squat) = triple de intensidad'],
    overrideMinutes: 45,
  },

  noequip_mobility: {
    headline: '🚫🧘 Movilidad — Yoga & Activación',
    subtitle: 'Estiramientos · Articulaciones · Bienestar total',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['hip_circle', 'cat_cow', 'pigeon_stretch', 'world_stretch', 'inchworm', 'shoulder_rotation', 'superman', 'glute_bridge'],
    routineTemplate: {
      name: 'Yoga & Movilidad — Sin Equipo', description: 'Sesión de movilidad articular y flexibilidad sin ningún equipo.',
      exercises: [
        { exerciseId: 'cat_cow',           sets: 3, reps: '12',      rest: 15  },
        { exerciseId: 'hip_circle',        sets: 2, reps: '10/lado', rest: 15  },
        { exerciseId: 'inchworm',          sets: 3, reps: '8',       rest: 20  },
        { exerciseId: 'world_stretch',     sets: 2, reps: '8/lado',  rest: 15  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '60s/l.',  rest: 10  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 10  },
        { exerciseId: 'superman',          sets: 3, reps: '15',      rest: 20  },
        { exerciseId: 'glute_bridge',      sets: 3, reps: '15',      rest: 20  },
      ],
      frequency: 'diario', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['Movimientos lentos y conscientes: este no es un entrenamiento de fuerza', 'Mantén los estiramientos 30-60s para cambios reales', 'Combina con respiración abdominal profunda'],
    overrideMinutes: 30,
  },

  noequip_endurance: {
    headline: '🚫⚡ Resistencia Calistenia — Extrema',
    subtitle: 'Volumen alto · Solo cuerpo · Sin límites',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['push_up', 'squat', 'lunge', 'mountain_climber', 'plank', 'crunch', 'bear_crawl', 'glute_bridge'],
    routineTemplate: {
      name: 'Resistencia Calistenia', description: 'Resistencia muscular extrema con solo peso corporal.',
      exercises: [
        { exerciseId: 'push_up',          sets: 5, reps: '20-25',  rest: 45  },
        { exerciseId: 'squat',            sets: 5, reps: '25-30',  rest: 45  },
        { exerciseId: 'lunge',            sets: 4, reps: '15/lado',rest: 45  },
        { exerciseId: 'mountain_climber', sets: 4, reps: '30s',    rest: 30  },
        { exerciseId: 'plank',            sets: 4, reps: '60s',    rest: 30  },
        { exerciseId: 'bear_crawl',       sets: 3, reps: '20m',    rest: 30  },
        { exerciseId: 'crunch',           sets: 3, reps: '25',     rest: 20  },
      ],
      frequency: '4-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['100 flexiones divididas en series = objetivo de élite', 'El descanso corto es lo que construye resistencia real', 'Añade series con el tiempo, no solo repeticiones'],
    overrideMinutes: 45,
  },

  noequip_recovery: {
    headline: '🚫🛡 Recuperación — Descanso Activo',
    subtitle: 'Movilidad suave · Sin fatiga · Regeneración',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['cat_cow', 'hip_circle', 'pigeon_stretch', 'superman', 'glute_bridge', 'shoulder_rotation'],
    routineTemplate: {
      name: 'Recuperación Calistenia', description: 'Sesión muy suave de recuperación con solo peso corporal.',
      exercises: [
        { exerciseId: 'cat_cow',           sets: 3, reps: '10',      rest: 20  },
        { exerciseId: 'hip_circle',        sets: 2, reps: '8/lado',  rest: 15  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '45s/l.',  rest: 10  },
        { exerciseId: 'superman',          sets: 3, reps: '12',      rest: 30  },
        { exerciseId: 'glute_bridge',      sets: 3, reps: '15',      rest: 30  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 10  },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['No debe sentirse como entrenamiento', 'Camina 20-30 min después', 'Este es tu día de restauración muscular'],
    overrideMinutes: 22,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // OUTDOOR — parque, barras callejeras, escaleras, sprints
  // ════════════════════════════════════════════════════════════════════════════

  outdoor_cardio: {
    headline: '🌳❤️ Cardio Outdoor — Parque',
    subtitle: 'Sprints · Escaleras · Barras · Circuito exterior',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['sprint', 'stair_climb', 'pull_up', 'push_up', 'dip', 'squat', 'box_jump', 'plank'],
    routineTemplate: {
      name: 'Circuito Outdoor — Cardio', description: 'Cardio en exteriores con sprints, escaleras y barras del parque.',
      exercises: [
        { exerciseId: 'sprint',       sets: 6, reps: '30m',    rest: 60  },
        { exerciseId: 'stair_climb',  sets: 4, reps: '2min',   rest: 60  },
        { exerciseId: 'pull_up',      sets: 4, reps: '10',     rest: 45  },
        { exerciseId: 'push_up',      sets: 3, reps: '15-20',  rest: 30  },
        { exerciseId: 'box_jump',     sets: 3, reps: '8-10',   rest: 45  },
        { exerciseId: 'lunge',        sets: 3, reps: '15/lado',rest: 30  },
        { exerciseId: 'plank',        sets: 3, reps: '45s',    rest: 30  },
      ],
      frequency: '3-4veces/semana', category: 'hiit', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Calienta 10 min corriendo suave', 'Usa las barras del parque para dominadas y fondos', 'Sprints en cuesta = 30% más quema que en plano'],
    overrideMinutes: 50,
  },

  outdoor_burn: {
    headline: '🌳🔥 Quema Outdoor — Alta Intensidad',
    subtitle: 'Sprints + circuito + barras · Máxima quema',
    accentColor: '#F87171', secondaryColor: '#EF4444',
    exerciseIds: ['sprint', 'box_jump', 'burpee', 'pull_up', 'push_up', 'dip', 'jump_squat', 'lunge'],
    routineTemplate: {
      name: 'HIIT Outdoor — Quema Total', description: 'Circuito quema calorías al aire libre. Sprints + calistenia en parque.',
      exercises: [
        { exerciseId: 'sprint',    sets: 6, reps: '30m',    rest: 45  },
        { exerciseId: 'burpee',    sets: 3, reps: '12-15',  rest: 30  },
        { exerciseId: 'pull_up',   sets: 4, reps: '8-10',   rest: 45  },
        { exerciseId: 'box_jump',  sets: 3, reps: '8-10',   rest: 45  },
        { exerciseId: 'push_up',   sets: 4, reps: '15-20',  rest: 30  },
        { exerciseId: 'jump_squat',sets: 3, reps: '15',     rest: 30  },
        { exerciseId: 'lunge',     sets: 3, reps: '12/lado',rest: 30  },
      ],
      frequency: '4-5veces/semana', category: 'hiit', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Empieza con 10 min de trote suave', 'El aire fresco mejora el rendimiento aeróbico', 'Sprint en cuesta entre circuitos para más quema'],
    overrideMinutes: 45,
  },

  outdoor_muscle: {
    headline: '🌳💪 Fuerza Outdoor — Calistenia Real',
    subtitle: 'Barras del parque · Fuerza funcional',
    accentColor: '#FF6B1A', secondaryColor: '#FFA052',
    exerciseIds: ['pull_up', 'dip', 'push_up', 'squat', 'lunge', 'hip_thrust', 'step_up', 'box_jump'],
    routineTemplate: {
      name: 'Fuerza Outdoor — Parque', description: 'Entrenamiento de fuerza con las barras y el entorno del parque.',
      exercises: [
        { exerciseId: 'pull_up',  sets: 5, reps: '6-8',    rest: 120 },
        { exerciseId: 'dip',      sets: 4, reps: '10-12',  rest: 90  },
        { exerciseId: 'push_up',  sets: 5, reps: '12-15',  rest: 75  },
        { exerciseId: 'squat',    sets: 4, reps: '15-20',  rest: 60  },
        { exerciseId: 'step_up',  sets: 3, reps: '12/lado',rest: 60  },
        { exerciseId: 'hip_thrust',sets:4, reps: '15-20',  rest: 60  },
        { exerciseId: 'box_jump', sets: 3, reps: '8',      rest: 60  },
      ],
      frequency: '3-4veces/semana', category: 'fullbody', difficulty: 4, isAIGenerated: true,
    },
    tips: ['Busca un parque con barras de diferentes alturas', 'Dominadas con lastre (mochila) para progresar', 'La calistenia en el parque = fuerza funcional máxima'],
    overrideMinutes: 60,
  },

  outdoor_endurance: {
    headline: '🌳⚡ Resistencia Outdoor — Total',
    subtitle: 'Parque como gym · Resistencia cardiovascular',
    accentColor: '#4ADE80', secondaryColor: '#22C55E',
    exerciseIds: ['sprint', 'stair_climb', 'pull_up', 'push_up', 'dip', 'squat', 'lunge', 'plank'],
    routineTemplate: {
      name: 'Resistencia Outdoor', description: 'Circuito de resistencia al aire libre con barras y cardio.',
      exercises: [
        { exerciseId: 'sprint',      sets: 4, reps: '30m',    rest: 45  },
        { exerciseId: 'stair_climb', sets: 3, reps: '2min',   rest: 45  },
        { exerciseId: 'push_up',     sets: 5, reps: '20',     rest: 30  },
        { exerciseId: 'pull_up',     sets: 4, reps: '10-12',  rest: 45  },
        { exerciseId: 'squat',       sets: 4, reps: '25',     rest: 30  },
        { exerciseId: 'lunge',       sets: 4, reps: '15/lado',rest: 30  },
        { exerciseId: 'dip',         sets: 3, reps: '15',     rest: 30  },
        { exerciseId: 'plank',       sets: 3, reps: '60s',    rest: 30  },
      ],
      frequency: '4-5veces/semana', category: 'fullbody', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Combina correr entre circuitos para máxima resistencia', 'El terreno irregular del parque activa más músculos', 'Entrena por tiempo total, no por series'],
    overrideMinutes: 55,
  },

  outdoor_legs: {
    headline: '🌳🦵 Piernas Outdoor — Explosivo',
    subtitle: 'Escaleras · Saltos · Sprints en cuesta',
    accentColor: '#C084FC', secondaryColor: '#A855F7',
    exerciseIds: ['squat', 'lunge', 'step_up', 'stair_climb', 'box_jump', 'jump_squat', 'calf_raise', 'hip_thrust'],
    routineTemplate: {
      name: 'Piernas Outdoor', description: 'Tren inferior explosivo al aire libre con escaleras y saltos.',
      exercises: [
        { exerciseId: 'squat',       sets: 5, reps: '20',    rest: 60  },
        { exerciseId: 'lunge',       sets: 4, reps: '15/lado',rest:60  },
        { exerciseId: 'stair_climb', sets: 5, reps: '2min',  rest: 60  },
        { exerciseId: 'box_jump',    sets: 4, reps: '8-10',  rest: 60  },
        { exerciseId: 'step_up',     sets: 3, reps: '12/lado',rest:60  },
        { exerciseId: 'jump_squat',  sets: 3, reps: '15',    rest: 45  },
        { exerciseId: 'calf_raise',  sets: 4, reps: '30',    rest: 30  },
      ],
      frequency: '2-3veces/semana', category: 'legs', difficulty: 3, isAIGenerated: true,
    },
    tips: ['Escaleras del parque son el mejor ejercicio de glúteos', 'Sprint en cuesta 6×30m al final como finisher', 'Los saltos desarrollan potencia además de volumen'],
    overrideMinutes: 55,
  },

  outdoor_mobility: {
    headline: '🌳🧘 Movilidad Outdoor — Naturaleza',
    subtitle: 'Flexibilidad al aire libre · Mente y cuerpo',
    accentColor: '#60A5FA', secondaryColor: '#3B82F6',
    exerciseIds: ['hip_circle', 'cat_cow', 'pigeon_stretch', 'inchworm', 'world_stretch', 'lunge', 'shoulder_rotation', 'superman'],
    routineTemplate: {
      name: 'Movilidad Outdoor', description: 'Sesión de movilidad y bienestar en el parque al aire libre.',
      exercises: [
        { exerciseId: 'cat_cow',           sets: 3, reps: '10',      rest: 15  },
        { exerciseId: 'hip_circle',        sets: 2, reps: '10/lado', rest: 15  },
        { exerciseId: 'inchworm',          sets: 3, reps: '8',       rest: 20  },
        { exerciseId: 'world_stretch',     sets: 2, reps: '8/lado',  rest: 15  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '45s/l.',  rest: 10  },
        { exerciseId: 'lunge',             sets: 3, reps: '8/lado',  rest: 15  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 10  },
      ],
      frequency: 'diario', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['El aire fresco y el sol mejoran el estado mental', 'Combina con caminata de 20-30 min', 'Ideal como warm-up antes de entrenar en el parque'],
    overrideMinutes: 30,
  },

  outdoor_recovery: {
    headline: '🌳🛡 Recuperación Outdoor — Caminata',
    subtitle: 'Movilidad suave · Parque · Mente despejada',
    accentColor: '#34D399', secondaryColor: '#10B981',
    exerciseIds: ['cat_cow', 'hip_circle', 'pigeon_stretch', 'inchworm', 'lunge', 'shoulder_rotation'],
    routineTemplate: {
      name: 'Recuperación Outdoor', description: 'Sesión suave de recuperación al aire libre. Caminata + movilidad.',
      exercises: [
        { exerciseId: 'cat_cow',           sets: 3, reps: '10',      rest: 20  },
        { exerciseId: 'hip_circle',        sets: 2, reps: '8/lado',  rest: 15  },
        { exerciseId: 'inchworm',          sets: 2, reps: '6',       rest: 20  },
        { exerciseId: 'pigeon_stretch',    sets: 2, reps: '45s/l.',  rest: 10  },
        { exerciseId: 'lunge',             sets: 3, reps: '8/lado',  rest: 20  },
        { exerciseId: 'shoulder_rotation', sets: 2, reps: '10/lado', rest: 10  },
      ],
      frequency: '1-2veces/semana', category: 'custom', difficulty: 1, isAIGenerated: true,
    },
    tips: ['30 min de caminata al sol es suficiente', 'El parque y el aire fresco aceleran la recuperación mental', 'Combina con respiración profunda y mindfulness'],
    overrideMinutes: 25,
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
      return {
        exerciseId: id,
        intensity: meta.intensity,
        setsReps: meta.setsReps,
        calories: meta.caloriesPerSet * sets,
        badges: meta.badges,
        tip: meta.tip,
      }
    })
    .filter(Boolean) as AIExerciseCard[]

  const totalCalories = exercises.reduce((t, e) => t + e.calories, 0)
  const estimatedMinutes = comb.overrideMinutes ?? (comb.routineTemplate.exercises.length * 9 + 15)

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

// Equipment constraints per training type (for AI prompt)
const EQUIPMENT_CONTEXT: Record<TrainingType, string> = {
  gym: 'Gimnasio completo: barras, mancuernas, poleas, máquinas (leg press, curl femoral, lat pulldown, cinta, remo), todo disponible.',
  home: 'En casa: mancuernas, barra de dominadas opcional. SIN máquinas de gym, SIN barras olímpicas, SIN poleas.',
  noequip: 'Sin ningún equipo: SOLO peso corporal puro. Sin mancuernas, sin barras, sin máquinas, sin nada. Solo el cuerpo.',
  outdoor: 'Exterior/parque: barras callejeras (dominadas, fondos), escaleras, banco del parque. Sin máquinas de gym.',
}

const GOAL_CONTEXT: Record<TrainingGoal, string> = {
  burn: 'Quemar grasa al máximo: HIIT, circuitos, cardio intenso, muchas calorías, poco descanso (20-45s).',
  muscle: 'Ganar músculo/hipertrofia: compound pesado, series de 6-12 reps, progresión de carga, descanso 75-120s.',
  endurance: 'Resistencia muscular: alto volumen (15-25 reps), descanso corto (30-60s), músculos resistentes.',
  mobility: 'Movilidad y flexibilidad: estiramientos dinámicos, movilidad articular, movimientos lentos y controlados.',
  cardio: 'Cardio y resistencia cardiovascular: frecuencia cardíaca elevada, circuitos continuos, cardio sostenido.',
  legs: 'Especialización tren inferior: cuádriceps, isquios, glúteos, gemelos. Volumen piernas.',
  recovery: 'Recuperación activa: trabajo muy ligero (40-50% intensidad), movilidad suave, sin fatiga.',
  ai: 'Personalizado por IA según tu perfil completo.',
}

export async function generateSmartContent(
  type: TrainingType,
  goal: TrainingGoal,
): Promise<SmartWorkoutContent> {
  const cacheKey = `${type}_${goal}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const staticContent = buildStaticContent(type, goal)

  if (!import.meta.env.VITE_GROQ_API_KEY) return staticContent

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1800,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content: 'Eres un entrenador personal experto. Generas planes de entrenamiento en JSON puro válido. NUNCA uses markdown. Solo JSON. Respeta ESTRICTAMENTE las restricciones de equipamiento.',
          },
          {
            role: 'user',
            content: `Genera un entrenamiento personalizado para esta combinación exacta:

EQUIPAMIENTO DISPONIBLE: ${EQUIPMENT_CONTEXT[type]}
OBJETIVO: ${GOAL_CONTEXT[goal]}

REGLA CRÍTICA: Solo usa ejercicios compatibles con el equipamiento disponible.
EJERCICIOS VÁLIDOS (IDs exactos): ${VALID_EXERCISE_IDS}

Devuelve EXACTAMENTE este JSON sin markdown:
{
  "headline": "emoji + título motivador",
  "subtitle": "descripción breve de la combinación",
  "exercises": [
    { "exerciseId": "bench_press", "intensity": "Alta", "setsReps": "4×8-10", "calories": 72, "badges": ["Compuesto","Pecho"], "tip": "consejo breve" }
  ],
  "routine": {
    "name": "nombre rutina",
    "description": "descripción",
    "exercises": [{ "exerciseId": "bench_press", "sets": 4, "reps": "8-10", "rest": 90 }],
    "frequency": "3-4veces/semana",
    "category": "push",
    "difficulty": 4,
    "isAIGenerated": true
  },
  "tips": ["tip1", "tip2", "tip3"]
}

Reglas:
- intensity solo: Baja, Media, Alta, Extrema
- category solo: push, pull, legs, fullbody, hiit, custom
- 6-8 ejercicios en exercises, 5-7 en routine.exercises
- Para noequip: SOLO bodyweight (push_up, squat, lunge, plank, crunch, burpee, jumping_jack, mountain_climber, high_knee, jump_squat, bear_crawl, glute_bridge, russian_twist, wall_sit, superman, step_up, inchworm, hip_circle, cat_cow, pigeon_stretch, world_stretch, shoulder_rotation)
- Para home: bodyweight + dumbbell (dumbbell_press, hammer_curl, lateral_raise, incline_curl), sin máquinas
- Para outdoor: bodyweight + barras (pull_up, dip), sin máquinas de gym
- Para gym: cualquier ejercicio disponible`,
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
