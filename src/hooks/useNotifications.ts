import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface AppNotification {
  id: string
  type: 'like' | 'comment' | 'follow'
  actorId: string
  actorUsername: string
  actorAvatar: string
  postId?: string
  read: boolean
  createdAt: string
}

interface DBNotifRow {
  id: string
  type: string
  actor_id: string
  post_id: string | null
  read: boolean
  created_at: string
  profiles: { username: string | null; avatar_url: string | null } | null
}

function rowToNotif(row: DBNotifRow): AppNotification {
  return {
    id: row.id,
    type: row.type as AppNotification['type'],
    actorId: row.actor_id,
    actorUsername: row.profiles?.username ?? 'usuario',
    actorAvatar: row.profiles?.avatar_url ?? '',
    postId: row.post_id ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  }
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, actor_id, post_id, read, created_at, profiles!actor_id(username, avatar_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(60)

      if (data && !error) {
        setNotifications((data as unknown as DBNotifRow[]).map(rowToNotif))
      }
    } catch {
      // table may not exist yet — fail silently
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [userId, unreadCount])

  useEffect(() => {
    fetch()
    if (!userId) return

    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as { id: string; type: string; actor_id: string; post_id: string | null; read: boolean; created_at: string }
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', row.actor_id)
            .single()

          setNotifications((prev) => [
            {
              id: row.id,
              type: row.type as AppNotification['type'],
              actorId: row.actor_id,
              actorUsername: profile?.username ?? 'usuario',
              actorAvatar: profile?.avatar_url ?? '',
              postId: row.post_id ?? undefined,
              read: false,
              createdAt: row.created_at,
            },
            ...prev,
          ])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetch])

  return { notifications, unreadCount, loading, markAllAsRead }
}
