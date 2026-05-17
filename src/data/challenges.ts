import type { Routine } from '../types'

export const CHALLENGE_ROUTINES: Routine[] = [
  {
    id: 'challenge_28_fullbody',
    name: 'Desafío 28 Días — Cuerpo Completo',
    description: 'Tonifica y trabaja todos los grupos musculares en 28 días.',
    exercises: [
      { exerciseId: 'squat',       sets: 4, reps: '12',   rest: 60 },
      { exerciseId: 'push_up',     sets: 4, reps: '15',   rest: 45 },
      { exerciseId: 'barbell_row', sets: 3, reps: '12',   rest: 60 },
      { exerciseId: 'lunge',       sets: 3, reps: '10',   rest: 45 },
      { exerciseId: 'plank',       sets: 3, reps: '45s',  rest: 30 },
    ],
    frequency: 'Diario',
    category: 'fullbody',
    difficulty: 3,
  },
  {
    id: 'challenge_21_fatburn',
    name: 'Reto 21 Días — Pérdida de Grasa',
    description: 'Quema grasa y define tu cuerpo en 3 semanas.',
    exercises: [
      { exerciseId: 'squat',   sets: 4, reps: '15', rest: 45 },
      { exerciseId: 'push_up', sets: 4, reps: '20', rest: 30 },
      { exerciseId: 'lunge',   sets: 4, reps: '12', rest: 40 },
      { exerciseId: 'crunch',  sets: 3, reps: '20', rest: 30 },
      { exerciseId: 'plank',   sets: 3, reps: '30s', rest: 20 },
    ],
    frequency: 'Diario',
    category: 'hiit',
    difficulty: 3,
  },
  {
    id: 'challenge_30_muscle',
    name: 'Programa 30 Días — Ganar Músculo',
    description: 'Hipertrofia y fuerza para tu máximo potencial.',
    exercises: [
      { exerciseId: 'bench_press',    sets: 4, reps: '8', rest: 90 },
      { exerciseId: 'squat',          sets: 4, reps: '8', rest: 90 },
      { exerciseId: 'deadlift',       sets: 3, reps: '6', rest: 120 },
      { exerciseId: 'overhead_press', sets: 3, reps: '8', rest: 75 },
      { exerciseId: 'barbell_row',    sets: 3, reps: '8', rest: 75 },
    ],
    frequency: 'Diario',
    category: 'fullbody',
    difficulty: 4,
  },
  {
    id: 'challenge_14_core',
    name: 'Reto 14 Días — Core de Acero',
    description: 'Abdomen marcado y core fuerte en 2 semanas.',
    exercises: [
      { exerciseId: 'plank',   sets: 4, reps: '60s', rest: 30 },
      { exerciseId: 'crunch',  sets: 4, reps: '25',  rest: 30 },
      { exerciseId: 'push_up', sets: 3, reps: '15',  rest: 45 },
      { exerciseId: 'lunge',   sets: 3, reps: '12',  rest: 40 },
      { exerciseId: 'squat',   sets: 3, reps: '15',  rest: 45 },
    ],
    frequency: 'Diario',
    category: 'custom',
    difficulty: 2,
  },
]

export const WARMUP_ROUTINES: Routine[] = [
  {
    id: 'warmup_mobility',
    name: 'Movilidad articular',
    description: 'Desbloquea tus articulaciones antes de cualquier entrenamiento.',
    exercises: [
      { exerciseId: 'lunge',      sets: 2, reps: '10', rest: 15 },
      { exerciseId: 'squat',      sets: 2, reps: '12', rest: 15 },
      { exerciseId: 'calf_raise', sets: 2, reps: '15', rest: 15 },
      { exerciseId: 'hip_thrust', sets: 2, reps: '10', rest: 15 },
    ],
    frequency: 'Pre-entreno',
    category: 'custom',
    difficulty: 1,
  },
  {
    id: 'warmup_dynamic',
    name: 'Calentamiento dinámico',
    description: 'Eleva la temperatura corporal y activa todos los grupos musculares.',
    exercises: [
      { exerciseId: 'squat',     sets: 2, reps: '20', rest: 20 },
      { exerciseId: 'push_up',   sets: 2, reps: '15', rest: 20 },
      { exerciseId: 'lunge',     sets: 2, reps: '12', rest: 20 },
      { exerciseId: 'face_pull', sets: 2, reps: '15', rest: 20 },
    ],
    frequency: 'Pre-entreno',
    category: 'custom',
    difficulty: 1,
  },
  {
    id: 'warmup_stretch',
    name: 'Estiramientos completos',
    description: 'Estiramiento total del cuerpo. Ideal post-entreno o días de descanso.',
    exercises: [
      { exerciseId: 'plank',              sets: 3, reps: '30s', rest: 15 },
      { exerciseId: 'romanian_deadlift',  sets: 2, reps: '10',  rest: 20 },
      { exerciseId: 'lunge',              sets: 2, reps: '10',  rest: 20 },
      { exerciseId: 'calf_raise',         sets: 2, reps: '15',  rest: 15 },
    ],
    frequency: 'Post-entreno',
    category: 'custom',
    difficulty: 1,
  },
  {
    id: 'warmup_core',
    name: 'Activación de core',
    description: 'Activa y estabiliza la zona central antes de levantamientos pesados.',
    exercises: [
      { exerciseId: 'plank',      sets: 3, reps: '45s', rest: 20 },
      { exerciseId: 'crunch',     sets: 3, reps: '20',  rest: 20 },
      { exerciseId: 'hip_thrust', sets: 2, reps: '15',  rest: 20 },
      { exerciseId: 'push_up',    sets: 2, reps: '12',  rest: 20 },
    ],
    frequency: 'Pre-entreno',
    category: 'custom',
    difficulty: 2,
  },
]

export const ALL_STATIC_ROUTINES: Routine[] = [...CHALLENGE_ROUTINES, ...WARMUP_ROUTINES]
