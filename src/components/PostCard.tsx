import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Clock, Dumbbell } from 'lucide-react'
import type { SocialPost } from '../types'
import { RANK_DATA } from '../data/ranks'
import { useSocialStore } from '../store/socialStore'
import { likePost, unlikePost } from '../services/socialService'
import { useAuth } from '../contexts/AuthContext'

interface PostCardProps {
  post: SocialPost
  isNew?: boolean
  onCommentClick?: () => void
}

export const PostCard: React.FC<PostCardProps> = ({ post, isNew = false, onCommentClick }) => {
  const { toggleLikeOptimistic } = useSocialStore()
  const { user } = useAuth()
  const [likePending, setLikePending] = useState(false)

  const handleLike = async () => {
    if (likePending || !user) return
    setLikePending(true)
    toggleLikeOptimistic(post.id) // optimistic
    try {
      if (!post.hasLiked) {
        await likePost(post.id, user.id)
      } else {
        await unlikePost(post.id, user.id)
      }
    } catch {
      toggleLikeOptimistic(post.id) // revert on error
    } finally {
      setLikePending(false)
    }
  }

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -16, scale: 0.97 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="card-metal p-4 mb-3 relative overflow-hidden"
      style={isNew ? { borderColor: 'rgba(255,107,26,0.35)' } : {}}
    >
      {/* New post shimmer */}
      {isNew && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #FF6B1A, transparent)' }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
          {post.avatar ? (
            <img src={post.avatar} alt={post.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center font-bold text-forge-orange">
              {post.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-forge-white text-sm">@{post.username}</div>
          <div className="text-xs text-forge-white/40">{post.timeAgo}</div>
        </div>
        {isNew && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,107,26,0.15)', color: '#FF6B1A' }}
          >
            Nuevo
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-forge-white/90 text-sm leading-relaxed mb-3">{post.content}</p>

      {/* Image */}
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden mb-3 bg-forge-border">
          <img src={post.imageUrl} alt="workout" className="w-full h-48 object-cover" loading="lazy" />
        </div>
      )}

      {/* Workout Summary */}
      {post.workoutSummary && (
        <div className="bg-forge-black/50 rounded-xl p-3 mb-3 border border-forge-border">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell size={14} className="text-forge-orange" />
            <span className="text-sm font-semibold text-forge-white">{post.workoutSummary.name}</span>
          </div>
          <div className="flex gap-4 text-xs text-forge-white/60">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.workoutSummary.duration}min
            </span>
            <span>{(post.workoutSummary.volume / 1000).toFixed(1)}t vol.</span>
          </div>
          {post.workoutSummary.rankUpdates && post.workoutSummary.rankUpdates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.workoutSummary.rankUpdates.map((u, i) => {
                const newRank = RANK_DATA[u.to]
                return (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: `${newRank.color}20`, color: newRank.color }}
                  >
                    ↑ {u.muscle}: {RANK_DATA[u.from].label} → {newRank.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1">
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleLike}
          disabled={likePending}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.hasLiked ? 'text-red-400' : 'text-forge-white/40 hover:text-red-400'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={post.hasLiked ? 'liked' : 'not'}
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              <Heart size={18} fill={post.hasLiked ? 'currentColor' : 'none'} />
            </motion.span>
          </AnimatePresence>
          <span className="font-mono tabular-nums w-6 text-left">{post.likes}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => onCommentClick?.()}
          className="flex items-center gap-1.5 text-sm text-forge-white/40 hover:text-forge-white transition-colors"
        >
          <MessageCircle size={18} />
          <span className="font-mono tabular-nums">{post.comments}</span>
        </motion.button>

        <button className="flex items-center gap-1.5 text-sm text-forge-white/40 hover:text-forge-white transition-colors ml-auto">
          <Share2 size={18} />
        </button>
      </div>
    </motion.div>
  )
}

export default PostCard
