import { supabase } from '../lib/supabase'
import type { SocialPost, Friend, RankTier } from '../types'

export function timeAgoFromDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return `hace ${Math.floor(days / 7)}sem`
}

interface DBPostRow {
  id: string
  user_id: string
  content: string
  image_url: string | null
  workout_summary: Record<string, unknown> | null
  likes_count: number
  comments_count: number
  created_at: string
  profiles: { username: string; display_name: string; avatar_url: string | null } | null
}

export function dbRowToPost(row: DBPostRow, likedIds: Set<string> = new Set()): SocialPost {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.profiles?.username ?? 'usuario',
    avatar: row.profiles?.avatar_url ?? '',
    content: row.content,
    imageUrl: row.image_url ?? undefined,
    workoutSummary: row.workout_summary as SocialPost['workoutSummary'],
    likes: row.likes_count ?? 0,
    comments: row.comments_count ?? 0,
    timeAgo: timeAgoFromDate(row.created_at),
    hasLiked: likedIds.has(row.id),
    createdAt: row.created_at,
  }
}

export async function fetchFeedPosts(currentUserId?: string, limit = 30): Promise<SocialPost[]> {
  const { data, error } = await supabase
    .from('social_posts')
    .select('id, user_id, content, image_url, workout_summary, likes_count, comments_count, created_at, profiles(username, display_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) throw new Error(error?.message ?? 'fetch failed')

  let likedIds = new Set<string>()
  if (currentUserId && data.length > 0) {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', data.map((p) => p.id))
    if (likes) likedIds = new Set(likes.map((l) => l.post_id))
  }

  return (data as unknown as DBPostRow[]).map((row) => dbRowToPost(row, likedIds))
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  if (error) throw error
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .match({ post_id: postId, user_id: userId })
  if (error) throw error
}

export async function createSocialPost(params: {
  userId: string
  content: string
  imageUrl?: string
  workoutSummary?: unknown
}): Promise<void> {
  const { error } = await supabase.from('social_posts').insert({
    user_id: params.userId,
    content: params.content,
    image_url: params.imageUrl ?? null,
    workout_summary: params.workoutSummary ?? null,
  })
  if (error) throw error
}

export async function uploadPostImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

export async function fetchFriends(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('following_id, profiles!friendships_following_id_fkey(id, username, display_name, avatar_url, streak)')
    .eq('follower_id', userId)

  if (error || !data) return []

  return data.map((row) => {
    const p = row.profiles as unknown as {
      id: string; username: string; display_name: string; avatar_url: string | null; streak: number
    } | null
    return {
      id: row.following_id,
      username: p?.username ?? 'unknown',
      displayName: p?.display_name ?? 'Unknown',
      avatar: p?.avatar_url ?? '',
      rankTier: 'hierro' as RankTier,
      streak: p?.streak ?? 0,
      isFollowing: true,
      weeklyVolume: 0,
    }
  })
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .insert({ follower_id: followerId, following_id: followingId })
  if (error) throw error
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .match({ follower_id: followerId, following_id: followingId })
  if (error) throw error
}

export async function fetchLeaderboardFromDB() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, streak')
    .order('streak', { ascending: false })
    .limit(20)

  if (error || !data) throw new Error(error?.message ?? 'fetch failed')
  return data
}
