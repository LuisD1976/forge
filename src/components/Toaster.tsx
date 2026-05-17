import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'
import type { ToastType } from '../store/toastStore'

const CONFIG: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)', color: '#4ADE80' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#EF4444' },
  warning: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', color: '#FBBF24' },
  info:    { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', color: '#60A5FA' },
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={17} />,
  error:   <XCircle size={17} />,
  warning: <AlertTriangle size={17} />,
  info:    <Info size={17} />,
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const cfg = CONFIG[t.type]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-start gap-3 px-4 py-3 rounded-2xl pointer-events-auto"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>
                {ICONS[t.type]}
              </span>
              <p className="flex-1 text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity"
                style={{ color: 'white' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
