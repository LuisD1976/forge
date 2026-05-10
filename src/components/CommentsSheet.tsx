import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserStore } from '../store/userStore'
import { useSocialStore } from '../store/socialStore'
import { timeAgoFromDate } from '../services/socialService'

interface Comment {
  id: string
  userId: string
  username: string
  avatar: string
  content: string
  createdAt: string
}

interface DBCommentRow {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles: { username: string | null; avatar_url: string | null } | null
}

interface CommentsSheetProps {
  postId: string
  onClose: () => void
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ postId, onClose }) => {
  const { user: authUser } = useAuth()
  const { user } = useUserStore()
  const { updatePostComments } = useSocialStore()

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  function rowToComment(row: DBCommentRow): Comment {
    return {
      id: row.id,
      userId: row.user_id,
      username: row.profiles?.username ?? 'usuario',
      avatar: row.profiles?.avatar_url ?? '',
      content: row.content,
      createdAt: row.created_at,
    }
  }

  useEffect(() => {
    // Initial fetch
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('post_comments')
        .select('id, post_id, user_id, content, created_at, profiles(username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) setComments((data as unknown as DBCommentRow[]).map(rowToComment))
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView(), 80)
    }
    load()

    // Realtime for this post's comments
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const row = payload.new as { id: string; post_id: string; user_id: string; content: string; created_at: string }
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', row.user_id)
            .single()

          const newComment: Comment = {
            id: row.id,
            userId: row.user_id,
            username: profile?.username ?? 'usuario',
            avatar: profile?.avatar_url ?? '',
            content: row.content,
            createdAt: row.created_at,
          }
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev
            return [...prev, newComment]
          })
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [postId])

  const handleSend = async () => {
    if (!input.trim() || !authUser || sending) return
    setSending(true)

    // Optimistic comment
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      userId: authUser.id,
      username: user?.username ?? 'tú',
      avatar: user?.avatar ?? '',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }
    setComments((prev) => [...prev, optimistic])
    updatePostComments(postId, +1)
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)

    try {
      await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: authUser.id,
        content: optimistic.content,
      })
    } catch {
      // Revert optimistic on error
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
      updatePostComments(postId, -1)
      setInput(optimistic.content)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl"
        style={{
          backgroundColor: '#13131A',
          border: '1px solid #252530',
          borderBottom: 'none',
          maxHeight: '78vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-forge-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #252530' }}>
          <span className="font-semibold text-forge-white">
            Comentarios
            {comments.length > 0 && (
              <span className="ml-1.5 text-sm font-normal text-forge-white/40">({comments.length})</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-forge-white/40 hover:text-forge-white transition-colors"
            style={{ backgroundColor: '#252530' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
          {loading && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-forge-border flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-forge-border rounded w-24" />
                    <div className="h-3 bg-forge-border rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div className="text-center py-10">
              <p className="text-forge-white/30 text-sm">Sin comentarios aún</p>
              <p className="text-forge-white/20 text-xs mt-1">Sé el primero en comentar</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
                  {c.avatar
                    ? <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-forge-orange font-bold text-xs">
                        {c.username[0]?.toUpperCase()}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-forge-white">@{c.username}</span>
                    <span className="text-[11px] text-forge-white/30">{timeAgoFromDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-forge-white/80 leading-relaxed">{c.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid #252530' }}>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-forge-orange font-bold text-xs">
                  {user?.username?.[0]?.toUpperCase() ?? 'T'}
                </div>
            }
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Escribe un comentario..."
            className="flex-1 bg-transparent text-sm text-forge-white outline-none placeholder:text-forge-white/30"
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{ backgroundColor: input.trim() ? '#FF6B1A' : '#252530' }}
          >
            {sending
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <Send size={14} className={input.trim() ? 'text-white' : 'text-forge-white/30'} />
            }
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

export default CommentsSheet
