import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, MessageCircle, UserPlus, Bell } from 'lucide-react'
import type { AppNotification } from '../hooks/useNotifications'
import { timeAgoFromDate } from '../services/socialService'

interface NotificationsPanelProps {
  notifications: AppNotification[]
  loading: boolean
  onClose: () => void
  onMarkAllRead: () => void
}

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'like') return <Heart size={14} className="text-red-400" fill="currentColor" />
  if (type === 'comment') return <MessageCircle size={14} className="text-blue-400" />
  return <UserPlus size={14} className="text-green-400" />
}

function notifText(n: AppNotification): string {
  if (n.type === 'like') return 'le dio like a tu publicación'
  if (n.type === 'comment') return 'comentó en tu publicación'
  return 'empezó a seguirte'
}

const bgByType: Record<AppNotification['type'], string> = {
  like: 'rgba(239,68,68,0.12)',
  comment: 'rgba(96,165,250,0.12)',
  follow: 'rgba(74,222,128,0.12)',
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications, loading, onClose, onMarkAllRead,
}) => {
  const unread = notifications.filter((n) => !n.read).length

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
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-forge-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #252530' }}>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-forge-orange" />
            <span className="font-semibold text-forge-white">Notificaciones</span>
            {unread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#EF4444' }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-forge-orange font-medium"
              >
                Marcar todo leído
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-forge-white/40 hover:text-forge-white transition-colors"
              style={{ backgroundColor: '#252530' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="p-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-forge-border flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 bg-forge-border rounded w-3/4" />
                    <div className="h-2.5 bg-forge-border rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell size={32} className="text-forge-white/20" />
              <p className="text-forge-white/30 text-sm">Sin notificaciones</p>
              <p className="text-forge-white/20 text-xs">Tus likes y comentarios aparecerán aquí</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-5 py-3.5 relative"
                style={{
                  backgroundColor: n.read ? 'transparent' : 'rgba(255,107,26,0.04)',
                  borderBottom: '1px solid #252530',
                }}
              >
                {/* Unread dot */}
                {!n.read && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#FF6B1A' }} />
                )}

                {/* Avatar + type icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-forge-border">
                    {n.actorAvatar
                      ? <img src={n.actorAvatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-forge-orange font-bold text-sm">
                          {n.actorUsername[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-forge-iron"
                    style={{ backgroundColor: bgByType[n.type] }}
                  >
                    <NotifIcon type={n.type} />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-forge-white leading-snug">
                    <span className="font-semibold">@{n.actorUsername}</span>{' '}
                    <span className="text-forge-white/60">{notifText(n)}</span>
                  </p>
                  <p className="text-xs text-forge-white/30 mt-0.5">{timeAgoFromDate(n.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

export default NotificationsPanel
