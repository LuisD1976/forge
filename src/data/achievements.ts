export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  rarity: AchievementRarity
}

export interface AchievementStats {
  totalWorkouts: number
  streak: number
  totalVolumeKg: number
  prCount: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primer_entreno',    name: 'Primer Paso',         description: 'Completaste tu primer entreno',          icon: '🔥', xpReward: 100,  rarity: 'common' },
  { id: 'tres_dias',         name: 'Racha Inicial',        description: '3 días seguidos entrenando',             icon: '⚡', xpReward: 150,  rarity: 'common' },
  { id: 'siete_dias',        name: 'Semana de Fuego',      description: '7 días de racha consecutiva',            icon: '🏅', xpReward: 300,  rarity: 'rare' },
  { id: 'treinta_dias',      name: 'Incansable',           description: '30 días de racha sin parar',             icon: '💎', xpReward: 1000, rarity: 'epic' },
  { id: 'diez_entrenos',     name: 'Constante',            description: '10 entrenamientos completados',          icon: '💪', xpReward: 200,  rarity: 'common' },
  { id: 'cincuenta_entrenos',name: 'Veterano',             description: '50 entrenamientos completados',          icon: '🏆', xpReward: 500,  rarity: 'rare' },
  { id: 'cien_entrenos',     name: 'Centurión',            description: '100 entrenamientos completados',         icon: '👑', xpReward: 1500, rarity: 'epic' },
  { id: 'primer_pr',         name: 'Primera Marca',        description: 'Conseguiste tu primer récord personal',  icon: '🎯', xpReward: 200,  rarity: 'common' },
  { id: 'cinco_prs',         name: 'Máquina de PRs',       description: '5 récords personales establecidos',      icon: '🚀', xpReward: 400,  rarity: 'rare' },
  { id: 'tonelada',          name: 'Tonelada',             description: 'Has levantado 1,000 kg en total',        icon: '⚙️', xpReward: 150,  rarity: 'common' },
  { id: 'diez_toneladas',    name: 'Forjado en Hierro',    description: '10,000 kg de volumen total acumulado',   icon: '🔩', xpReward: 500,  rarity: 'rare' },
  { id: 'cien_toneladas',    name: 'Leyenda del Gym',      description: '100,000 kg de volumen total',            icon: '🌟', xpReward: 2000, rarity: 'legendary' },
]

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common:    '#9CA3AF',
  rare:      '#60A5FA',
  epic:      '#A855F7',
  legendary: '#FFD700',
}

export function getRarityColor(rarity: AchievementRarity) {
  return RARITY_COLORS[rarity]
}

export function getRarityLabel(rarity: AchievementRarity) {
  return { common: 'Común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario' }[rarity]
}

export function checkAchievements(stats: AchievementStats, unlockedIds: string[]): Achievement[] {
  const has = (id: string) => unlockedIds.includes(id)
  const result: Achievement[] = []
  const get = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!

  if (!has('primer_entreno')     && stats.totalWorkouts >= 1)    result.push(get('primer_entreno'))
  if (!has('tres_dias')          && stats.streak >= 3)           result.push(get('tres_dias'))
  if (!has('siete_dias')         && stats.streak >= 7)           result.push(get('siete_dias'))
  if (!has('treinta_dias')       && stats.streak >= 30)          result.push(get('treinta_dias'))
  if (!has('diez_entrenos')      && stats.totalWorkouts >= 10)   result.push(get('diez_entrenos'))
  if (!has('cincuenta_entrenos') && stats.totalWorkouts >= 50)   result.push(get('cincuenta_entrenos'))
  if (!has('cien_entrenos')      && stats.totalWorkouts >= 100)  result.push(get('cien_entrenos'))
  if (!has('primer_pr')          && stats.prCount >= 1)          result.push(get('primer_pr'))
  if (!has('cinco_prs')          && stats.prCount >= 5)          result.push(get('cinco_prs'))
  if (!has('tonelada')           && stats.totalVolumeKg >= 1000)    result.push(get('tonelada'))
  if (!has('diez_toneladas')     && stats.totalVolumeKg >= 10000)   result.push(get('diez_toneladas'))
  if (!has('cien_toneladas')     && stats.totalVolumeKg >= 100000)  result.push(get('cien_toneladas'))

  return result
}
