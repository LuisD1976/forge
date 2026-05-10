import type { SocialPost, Friend, RankTier } from '../types'

export const MOCK_FRIENDS: Friend[] = []

export const MOCK_POSTS: SocialPost[] = []

export const LEADERBOARD: {
  rank: number
  username: string
  displayName: string
  avatar: string
  weeklyVolume: number
  tier: RankTier
}[] = []
