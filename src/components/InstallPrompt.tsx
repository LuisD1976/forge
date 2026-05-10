import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Share } from 'lucide-react'
import { capturePWAInstallPrompt, triggerPWAInstall, isPWAInstallable, isPWAInstalled, isIOS } from '../utils/pwaInstall'

export const InstallPrompt: React.FC = () => {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [iosGuide, setIosGuide] = useState(false)

  useEffect(() => {
    capturePWAInstallPrompt()
    const timer = setTimeout(() => {
      if (!isPWAInstalled() && !localStorage.getItem('forge-install-dismissed')) {
        if (isIOS()) {
          setIosGuide(true)
          setShow(true)
        } else {
          setShow(isPWAInstallable())
        }
      }
    }, 4000)

    const onPromptReady = () => {
      if (!isPWAInstalled() && !localStorage.getItem('forge-install-dismissed')) {
        setShow(true)
      }
    }
    window.addEventListener('beforeinstallprompt', onPromptReady)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPromptReady)
    }
  }, [])

  const handleInstall = async () => {
    if (iosGuide) {
      setDismissed(true)
      setShow(false)
      return
    }
    const ok = await triggerPWAInstall()
    if (ok) setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('forge-install-dismissed', '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80"
        >
          <div className="bg-forge-iron border border-forge-border rounded-2xl p-4 shadow-2xl"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,107,26,0.2)' }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-forge-white/40 hover:text-forge-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF6B1A, #FFA052)' }}
              >
                <Download size={18} className="text-white" />
              </div>
              <div>
                <div className="font-bold text-forge-white text-sm">Instala FORGE</div>
                <div className="text-forge-white/50 text-xs">Acceso rápido desde tu pantalla de inicio</div>
              </div>
            </div>

            {iosGuide ? (
              <div className="bg-forge-black rounded-xl p-3 mb-3">
                <p className="text-xs text-forge-white/70 mb-2">Para instalar en iOS:</p>
                <div className="flex items-start gap-2 text-xs text-forge-white/60">
                  <Share size={14} className="text-forge-orange mt-0.5 flex-shrink-0" />
                  <span>Pulsa el botón <strong className="text-forge-white">Compartir</strong> → <strong className="text-forge-white">Añadir a pantalla de inicio</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-forge-white/50 mb-3">
                Instala la app para una experiencia nativa, soporte offline y acceso directo.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 rounded-xl text-sm text-forge-white/50 bg-forge-border hover:bg-forge-border/70 transition-colors"
              >
                Más tarde
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white btn-forge"
              >
                {iosGuide ? 'Entendido' : 'Instalar'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
