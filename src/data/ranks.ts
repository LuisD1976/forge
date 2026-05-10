import type { RankInfo, RankTier } from '../types'

export const RANK_DATA: Record<RankTier, RankInfo> = {
  hierro: {
    tier: 'hierro',
    label: 'Hierro',
    color: '#6B7280',
    bgColor: '#1F2937',
    minPercentile: 0,
    maxPercentile: 10,
    icon: '▲',
  },
  bronce: {
    tier: 'bronce',
    label: 'Bronce',
    color: '#CD7F32',
    bgColor: '#2D1B0E',
    minPercentile: 10,
    maxPercentile: 20,
    icon: '●',
  },
  acero: {
    tier: 'acero',
    label: 'Acero',
    color: '#9CA3AF',
    bgColor: '#1F2937',
    minPercentile: 20,
    maxPercentile: 35,
    icon: '■',
  },
  cobre: {
    tier: 'cobre',
    label: 'Cobre',
    color: '#B87333',
    bgColor: '#2D1B0E',
    minPercentile: 35,
    maxPercentile: 50,
    icon: '⬡',
  },
  plata: {
    tier: 'plata',
    label: 'Plata',
    color: '#C0C0C0',
    bgColor: '#1E1E24',
    minPercentile: 50,
    maxPercentile: 65,
    icon: '◆',
  },
  oro: {
    tier: 'oro',
    label: 'Oro',
    color: '#FFD700',
    bgColor: '#2D2400',
    minPercentile: 65,
    maxPercentile: 80,
    icon: '★',
  },
  titanio: {
    tier: 'titanio',
    label: 'Titanio',
    color: '#E8E8E8',
    bgColor: '#1A1A24',
    minPercentile: 80,
    maxPercentile: 90,
    icon: '⬠',
  },
  platino: {
    tier: 'platino',
    label: 'Platino',
    color: '#A855F7',
    bgColor: '#1E0A2D',
    minPercentile: 90,
    maxPercentile: 95,
    icon: '⬡',
  },
  diamante: {
    tier: 'diamante',
    label: 'Diamante',
    color: '#67E8F9',
    bgColor: '#0C1E2D',
    minPercentile: 95,
    maxPercentile: 99,
    icon: '◈',
  },
  leyenda: {
    tier: 'leyenda',
    label: 'Leyenda',
    color: '#FF6B1A',
    bgColor: '#2D0A00',
    minPercentile: 99,
    maxPercentile: 100,
    icon: '♛',
  },
}

export const RANK_ORDER: RankTier[] = [
  'hierro', 'bronce', 'acero', 'cobre', 'plata',
  'oro', 'titanio', 'platino', 'diamante', 'leyenda',
]

// Strength standards (kg) by percentile for male 80kg bodyweight
// [percentile_10, 20, 35, 50, 65, 80, 90, 95, 99]
export const STRENGTH_STANDARDS: Record<string, number[]> = {
  bench_press: [40, 60, 80, 100, 115, 130, 145, 160, 185],
  squat: [50, 80, 100, 130, 155, 180, 205, 225, 265],
  deadlift: [60, 90, 120, 155, 185, 210, 240, 265, 310],
  overhead_press: [25, 40, 55, 70, 82, 95, 107, 120, 140],
  barbell_row: [35, 55, 70, 90, 105, 120, 135, 150, 175],
  pull_up: [0, 1, 3, 6, 10, 15, 20, 25, 35],
  dip: [0, 3, 6, 10, 15, 20, 25, 30, 40],
}
