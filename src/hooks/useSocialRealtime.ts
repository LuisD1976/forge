import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSocialStore } from '../store/socialStore'
import { timeAgoFromDate } from '../services/socialService'
import type { SocialPost } from '../types'

export function useSocialRealtime(currentUserId?: string) {
  const { prependPost, updatePostLikes, updatePostComments, setRealtimeStatus } = useSocialStore()

  useEffect(() => {
    setRealtimeStatus('connecting')

    const channel = supabase
      .channel('forge-social-v1')
      // ── New post ──────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'social_posts' },
        async (payload) => {
          const row = payload.new as {
            id: string; user_id: string; content: string
            image_url: string | null; workout_summary: unknown
            likes_count: number; comments_count: number; created_at: string
          }

          // Skip own posts — already added optimistically
          if (row.user_id === currentUserId) return

          // Fetch author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', row.user_id)
            .single()

          const newPost: SocialPost = {
            id: row.id,
            userId: row.user_id,
            username: profile?.username ?? 'usuario',
            avatar: profile?.avatar_url ?? '',
            content: row.content,
            imageUrl: row.image_url ?? undefined,
            workoutSummary: row.workout_summary as SocialPost['workoutSummary'],
            likes: 0,
            comments: 0,
            timeAgo: timeAgoFromDate(row.created_at),
            hasLiked: false,
            createdAt: row.created_at,
          }

          prependPost(newPost, true) // goes to pending banner
        }
      )
      // ── Like added ────────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        (payload) => {
          const { post_id, user_id } = payload.new as { post_id: string; user_id: string }
          // Only update count — own likes are handled optimistically
          if (user_id !== currentUserId) {
            updatePostLikes(post_id, +1, undefined)
          }
        }
      )
      // ── Like removed ──────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        (payload) => {
          const { post_id, user_id } = payload.old as { post_id: string; user_id: string }
          if (user_id !== currentUserId) {
            updatePostLikes(post_id, -1, undefined)
          }
        }
      )
      // ── New comment ───────────────────────────────────────
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        (payload) => {
          const { post_id } = payload.new as { post_id: string }
          updatePostComments(post_id, +1)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error')
        else if (status === 'CLOSED') setRealtimeStatus('disconnected')
      })

    return () => {
      supabase.removeChannel(channel)
      setRealtimeStatus('disconnected')
    }
  }, [currentUserId])
}

// ── Presence: quién está online ──────────────────────────────

interface PresenceUser {
  userId: string
  username: string
  avatar: string
}

export function useSocialPresence(userId?: string, username?: string, avatar?: string) {
  const { setOnlineUsers } = useSocialStore()

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('forge-presence', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        const others = Object.values(state)
          .flat()
          .filter((u) => u.userId !== userId)
        setOnlineUsers(others)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, username: username ?? '', avatar: avatar ?? '' })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setOnlineUsers([])
    }
  }, [userId, username, avatar])
}
