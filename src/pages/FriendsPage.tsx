import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trophy, TrendingUp, UserPlus, Flame, Wifi, WifiOff, ChevronUp, Bell, PenLine, Search, X, UserCheck } from 'lucide-react'
import { useSocialStore } from '../store/socialStore'
import { useAuth } from '../contexts/AuthContext'
import { useUserStore } from '../store/userStore'
import { RANK_DATA } from '../data/ranks'
import { LEADERBOARD } from '../data/social'
import { PostCard } from '../components/PostCard'
import { CommentsSheet } from '../components/CommentsSheet'
import { CreatePostModal } from '../components/CreatePostModal'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { useSocialRealtime, useSocialPresence } from '../hooks/useSocialRealtime'
import { useNotifications } from '../hooks/useNotifications'
import { fetchFeedPosts, fetchLeaderboardFromDB, searchUsers, followUser, unfollowUser } from '../services/socialService'
import type { LeaderboardEntry } from '../services/socialService'
import type { RankTier } from '../types'

type SocialTab = 'feed' | 'friends' | 'leaderboard'

type LBEntry = {
  rank: number
  username: string
  displayName: string
  avatar: string
  weeklyVolume: number
  tier: RankTier
}

function PostSkeleton() {
  return (
    <div className="card-metal p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-forge-border animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-forge-border rounded w-28 animate-pulse" />
          <div className="h-2.5 bg-forge-border rounded w-16 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-forge-border rounded w-full animate-pulse" />
        <div className="h-3 bg-forge-border rounded w-4/5 animate-pulse" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 bg-forge-border rounded w-10 animate-pulse" />
        <div className="h-4 bg-forge-border rounded w-10 animate-pulse" />
      </div>
    </div>
  )
}

export const FriendsPage: React.FC = () => {
  const { user: authUser } = useAuth()
  const { user } = useUserStore()
  const {
    posts, pendingPosts, friends, onlineUsers,
    postsLoading, realtimeStatus,
    setPosts, flushPending, setPostsLoading, toggleFollow,
  } = useSocialStore()

  const [activeTab, setActiveTab] = useState<SocialTab>('feed')
  const [leaderboard, setLeaderboard] = useState<LBEntry[]>(LEADERBOARD)
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set())
  const [commentPostId, setCommentPostId] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const feedTopRef = useRef<HTMLDivElement>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; displayName: string; avatar: string; isFollowing: boolean }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim() || !authUser) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchUsers(q, authUser.id)
        setSearchResults(results)
      } finally {
        setSearchLoading(false)
      }
    }, 350)
  }, [authUser])

  const handleToggleFollow = async (targetId: string, isFollowing: boolean) => {
    if (!authUser) return
    setSearchResults((prev) => prev.map((u) => u.id === targetId ? { ...u, isFollowing: !isFollowing } : u))
    try {
      if (isFollowing) await unfollowUser(authUser.id, targetId)
      else await followUser(authUser.id, targetId)
    } catch {
      setSearchResults((prev) => prev.map((u) => u.id === targetId ? { ...u, isFollowing } : u))
    }
  }

  useSocialRealtime(authUser?.id)
  useSocialPresence(authUser?.id, user?.username, user?.avatar)
  const { notifications, unreadCount, loading: notifsLoading, markAllAsRead } = useNotifications(authUser?.id)

  useEffect(() => {
    async function load() {
      setPostsLoading(true)
      try {
        const remote = await fetchFeedPosts(authUser?.id)
        if (remote.length > 0) setPosts(remote)
      } catch {
        // keep mock/cached posts
      } finally {
        setPostsLoading(false)
      }
    }
    load()
  }, [authUser?.id])

  useEffect(() => {
    fetchLeaderboardFromDB()
      .then((rows: LeaderboardEntry[]) =>
        setLeaderboard(
          rows.map((p, i) => ({
            rank: i + 1,
            username: p.username ?? '',
            displayName: p.display_name ?? '',
            avatar: p.avatar_url ?? '',
            weeklyVolume: p.weeklyVolume,
            tier: p.tier,
          }))
        )
      )
      .catch(() => { /* keep empty leaderboard */ })
  }, [])

  const handleFlushPending = () => {
    const ids = new Set(pendingPosts.map((p) => p.id))
    setNewPostIds(ids)
    flushPending()
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => setNewPostIds(new Set()), 6000)
  }

  const handleBell = () => {
    setShowNotifs(true)
    markAllAsRead()
  }

  const statusColor =
    realtimeStatus === 'connected' ? '#4ADE80' :
    realtimeStatus === 'connecting' ? '#FFA052' : '#6B7280'

  const tabs: { id: SocialTab; label: string; icon: React.ReactNode }[] = [
    { id: 'feed',        label: 'Feed',    icon: <TrendingUp size={16} /> },
    { id: 'friends',     label: 'Amigos',  icon: <Users size={16} /> },
    { id: 'leaderboard', label: 'Ranking', icon: <Trophy size={16} /> },
  ]

  return (
    <div className="flex flex-col pb-24">

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="px-4 pt-12 pb-2">
        <div className="flex items-start justify-between mb-2">
          {/* Title */}
          <div>
            <h1 className="font-display text-3xl text-gradient-forge">SOCIAL</h1>
            <p className="text-forge-white/50 text-sm">Compite y comparte</p>
          </div>

          {/* Bell */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBell}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#1A1A23', border: '1px solid #252530' }}
          >
            <Bell size={18} className="text-forge-white/60" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: '#EF4444' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Realtime + online row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {realtimeStatus === 'connected'
              ? <Wifi size={11} style={{ color: statusColor }} />
              : <WifiOff size={11} style={{ color: statusColor }} />}
            <span className="text-[10px] font-mono" style={{ color: statusColor }}>
              {realtimeStatus === 'connected' ? 'En vivo'
                : realtimeStatus === 'connecting' ? 'Conectando…' : 'Offline'}
            </span>
            {realtimeStatus === 'connected' && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#4ADE80' }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </div>

          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {onlineUsers.slice(0, 4).map((u) => (
                  <div key={u.userId} className="w-5 h-5 rounded-full border border-forge-iron overflow-hidden bg-forge-border">
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-[8px] text-forge-orange font-bold">
                          {u.username[0]?.toUpperCase()}
                        </div>}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-forge-white/30">{onlineUsers.length} activos</span>
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────── */}
      <div className="flex gap-1 mx-4 my-4 bg-forge-iron rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === tab.id ? 'bg-forge-orange text-white' : 'text-forge-white/50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'feed' && pendingPosts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingPosts.length > 9 ? '9+' : pendingPosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FEED ───────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div className="px-4">
          {/* Compose bar */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 text-left"
            style={{ backgroundColor: '#13131A', border: '1px solid #252530' }}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-forge-orange font-bold text-xs">
                    {user?.username?.[0]?.toUpperCase() ?? 'T'}
                  </div>}
            </div>
            <span className="flex-1 text-sm text-forge-white/30">¿Cómo fue el entreno?</span>
            <PenLine size={16} className="text-forge-white/20 flex-shrink-0" />
          </motion.button>

          <div ref={feedTopRef} />

          {/* New posts banner */}
          <AnimatePresence>
            {pendingPosts.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleFlushPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl mb-3 font-semibold text-sm"
                style={{ backgroundColor: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.3)', color: '#FF6B1A' }}
              >
                <ChevronUp size={14} />
                {pendingPosts.length === 1 ? '1 nueva publicación' : `${pendingPosts.length} nuevas publicaciones`}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Skeletons */}
          {postsLoading && posts.length === 0 && (
            <>{[0, 1, 2].map((i) => <PostSkeleton key={i} />)}</>
          )}

          {/* Posts */}
          <AnimatePresence initial={false}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isNew={newPostIds.has(post.id)}
                onCommentClick={() => setCommentPostId(post.id)}
              />
            ))}
          </AnimatePresence>

          {posts.length === 0 && !postsLoading && (
            <div className="text-center py-16">
              <p className="text-forge-white/30 text-sm">Aún no hay publicaciones</p>
              <p className="text-forge-white/20 text-xs mt-1">¡Sé el primero en compartir!</p>
            </div>
          )}
        </div>
      )}

      {/* ── AMIGOS ─────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <div className="px-4 flex flex-col gap-3">

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forge-white/30 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar atletas por nombre o @usuario..."
              className="w-full pl-9 pr-9 py-3 rounded-2xl text-sm text-forge-white outline-none"
              style={{ backgroundColor: '#13131A', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-white/30">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchQuery.trim() && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-forge-white/30 px-1">
                {searchLoading ? 'Buscando...' : searchResults.length === 0 ? 'Sin resultados' : `${searchResults.length} atleta${searchResults.length > 1 ? 's' : ''} encontrado${searchResults.length > 1 ? 's' : ''}`}
              </p>
              {searchResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-metal p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
                    {result.avatar
                      ? <img src={result.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-forge-orange/20 flex items-center justify-center text-forge-orange font-bold text-sm">
                          {result.displayName[0]?.toUpperCase()}
                        </div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-forge-white text-sm">{result.displayName}</div>
                    <div className="text-xs text-forge-white/40">@{result.username}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleFollow(result.id, result.isFollowing)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                    style={{
                      backgroundColor: result.isFollowing ? 'rgba(255,255,255,0.06)' : 'rgba(255,107,26,1)',
                      color: result.isFollowing ? 'rgba(255,255,255,0.5)' : 'white',
                    }}
                  >
                    {result.isFollowing ? <><UserCheck size={12} /> Siguiendo</> : <><UserPlus size={12} /> Seguir</>}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Friends list — only show when not searching */}
          {!searchQuery && friends.length === 0 && (
            <div className="text-center py-10">
              <Users size={36} className="text-forge-white/10 mx-auto mb-3" />
              <p className="text-forge-white/30 text-sm font-medium">Aún no sigues a nadie</p>
              <p className="text-forge-white/20 text-xs mt-1">Busca atletas arriba para empezar</p>
            </div>
          )}
          {!searchQuery && friends.map((friend) => {
            const rankData = RANK_DATA[friend.rankTier]
            const isOnline = onlineUsers.some((u) => u.username === friend.username)
            return (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card-metal p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-forge-border">
                      <img src={friend.avatar} alt={friend.displayName} className="w-full h-full object-cover" />
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-forge-iron flex items-center justify-center text-xs"
                      style={{ backgroundColor: rankData.bgColor, color: rankData.color }}
                    >
                      {rankData.icon}
                    </div>
                    {isOnline && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-forge-iron"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-forge-white text-sm">{friend.displayName}</span>
                      {isOnline && <span className="text-[10px] text-green-400 font-medium">● activo</span>}
                    </div>
                    <div className="text-xs text-forge-white/40">@{friend.username}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: rankData.color }}>{rankData.label}</span>
                      <span className="flex items-center gap-0.5 text-xs text-forge-white/40">
                        <Flame size={10} className="text-forge-orange" />{friend.streak}d
                      </span>
                      <span className="text-xs text-forge-white/40">
                        {(friend.weeklyVolume / 1000).toFixed(1)}t/sem
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollow(friend.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      friend.isFollowing ? 'bg-forge-border text-forge-white/70' : 'bg-forge-orange text-white'
                    }`}
                  >
                    {!friend.isFollowing && <UserPlus size={12} />}
                    {friend.isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── RANKING ────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="px-4">
          <div className="card-metal p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-forge-orange" />
              <span className="font-semibold text-forge-white">Ranking semanal</span>
            </div>
            <p className="text-xs text-forge-white/40">Volumen total esta semana</p>
          </div>

          <div className="flex flex-col gap-2">
            {leaderboard.length === 0 && (
              <div className="card-metal p-6 text-center">
                <Trophy size={32} className="text-forge-white/20 mx-auto mb-2" />
                <p className="text-forge-white/40 text-sm">El ranking se llenará con los primeros atletas que entrenen esta semana.</p>
              </div>
            )}
            {leaderboard.map((entry, i) => {
              const rankData = RANK_DATA[entry.tier]
              const isMe = entry.username === 'tú' || entry.username === user?.username
              const medals = ['🥇', '🥈', '🥉']
              return (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`card-metal p-4 flex items-center gap-3 ${isMe ? 'border-forge-orange/40' : ''}`}
                >
                  <div className="w-8 text-center flex-shrink-0">
                    {entry.rank <= 3
                      ? <span className="text-xl">{medals[entry.rank - 1]}</span>
                      : <span className="font-mono text-forge-white/50 font-bold">#{entry.rank}</span>}
                  </div>

                  <div className="w-10 h-10 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
                    {entry.avatar
                      ? <img src={entry.avatar} alt={entry.displayName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-forge-orange font-bold text-xs">
                          {entry.displayName[0] ?? '?'}
                        </div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${isMe ? 'text-forge-orange' : 'text-forge-white'}`}>
                      {entry.displayName}
                    </div>
                    <div className="text-xs" style={{ color: rankData.color }}>
                      {rankData.icon} {rankData.label}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-forge-white text-sm">
                      {entry.weeklyVolume > 0 ? `${(entry.weeklyVolume / 1000).toFixed(1)}t` : '—'}
                    </div>
                    <div className="text-xs text-forge-white/40">vol. semanal</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────── */}
      <AnimatePresence>
        {showCompose && (
          <CreatePostModal key="compose" onClose={() => setShowCompose(false)} />
        )}
        {commentPostId && (
          <CommentsSheet key="comments" postId={commentPostId} onClose={() => setCommentPostId(null)} />
        )}
        {showNotifs && (
          <NotificationsPanel
            key="notifs"
            notifications={notifications}
            loading={notifsLoading}
            onClose={() => setShowNotifs(false)}
            onMarkAllRead={markAllAsRead}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

export default FriendsPage
