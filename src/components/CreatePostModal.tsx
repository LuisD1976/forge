import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImagePlus, Send, Loader2, CheckCircle, AlertCircle, Flame } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserStore } from '../store/userStore'
import { useSocialStore } from '../store/socialStore'
import { createSocialPost, uploadPostImage } from '../services/socialService'
import { toast } from '../store/toastStore'
import type { SocialPost } from '../types'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface CreatePostModalProps {
  onClose: () => void
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
  const { user: authUser } = useAuth()
  const { user } = useUserStore()
  const { addPost } = useSocialStore()

  const [content, setContent] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploadedUrl, setImageUploadedUrl] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [posting, setPosting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  const canPost = content.trim().length > 0 && !posting && uploadState !== 'uploading'

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !authUser) return

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)

    const preview = URL.createObjectURL(file)
    previewUrlRef.current = preview
    setImagePreview(preview)
    setImageUploadedUrl(null)
    setUploadState('uploading')

    try {
      const url = await uploadPostImage(file, authUser.id)
      setImageUploadedUrl(url)
      setUploadState('done')
    } catch {
      setUploadState('error')
    }

    e.target.value = ''
  }, [authUser])

  const removeImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setImagePreview(null)
    setImageUploadedUrl(null)
    setUploadState('idle')
  }

  const handlePost = async () => {
    if (!canPost || !authUser) return
    setPosting(true)

    const finalImageUrl = uploadState === 'done' ? (imageUploadedUrl ?? undefined) : undefined

    const optimistic: SocialPost = {
      id: `opt-${Date.now()}`,
      userId: authUser.id,
      username: user?.username ?? 'tú',
      avatar: user?.avatar ?? '',
      content: content.trim(),
      imageUrl: imagePreview ?? finalImageUrl,
      likes: 0,
      comments: 0,
      timeAgo: 'ahora mismo',
      hasLiked: false,
      createdAt: new Date().toISOString(),
    }
    addPost(optimistic)
    onClose()

    try {
      await createSocialPost({
        userId: authUser.id,
        content: content.trim(),
        imageUrl: finalImageUrl,
      })
      toast.success('Publicación enviada')
    } catch {
      toast.error('No se pudo publicar. Verifica tu conexión.')
    } finally {
      setPosting(false)
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
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Centering wrapper — flexbox, no transform conflict */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 32 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-full rounded-3xl overflow-hidden pointer-events-auto"
          style={{
            maxWidth: 460,
            backgroundColor: '#0E0E14',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,107,26,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Orange accent line at top */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #FF6B1A, #FFA052, transparent)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-forge-orange" />
              <span className="font-bold text-forge-white tracking-wide text-sm">Nueva publicación</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-forge-white/40 hover:text-forge-white transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <X size={15} />
            </motion.button>
          </div>

          <div className="p-5">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden" style={{ border: '2px solid rgba(255,107,26,0.4)' }}>
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center font-bold text-forge-orange" style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.2), rgba(255,160,82,0.1))' }}>
                        {user?.displayName?.[0]?.toUpperCase() ?? 'T'}
                      </div>
                  }
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0E0E14]" />
              </div>
              <div>
                <div className="font-semibold text-forge-white text-sm leading-tight">{user?.displayName ?? 'Tú'}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,107,26,0.7)' }}>@{user?.username ?? 'usuario'}</div>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Cómo fue el entreno? Comparte tu progreso..."
              className="w-full text-forge-white/90 text-sm leading-relaxed outline-none resize-none"
              style={{ background: 'transparent', caretColor: '#FF6B1A' }}
              rows={4}
              maxLength={500}
              autoFocus
            />
            <div className="text-right text-xs mb-3" style={{ color: content.length > 400 ? '#FF6B1A' : 'rgba(255,255,255,0.15)' }}>
              {content.length}/500
            </div>

            {/* Image preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="relative rounded-2xl overflow-hidden" style={{ height: 180 }}>
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />

                    {uploadState === 'uploading' && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={28} className="text-white animate-spin" />
                          <span className="text-white text-xs font-medium">Subiendo imagen…</span>
                        </div>
                      </div>
                    )}

                    {uploadState === 'done' && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(74,222,128,0.9)', color: '#052e16' }}>
                        <CheckCircle size={12} />
                        Lista
                      </div>
                    )}

                    {uploadState === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle size={28} className="text-red-400" />
                          <span className="text-red-300 text-xs font-medium">Error al subir</span>
                          <button onClick={() => fileInputRef.current?.click()} className="text-xs text-forge-orange underline mt-1">
                            Reintentar
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={removeImage}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
                    >
                      <X size={13} className="text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'uploading'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: imagePreview ? 'rgba(255,107,26,0.12)' : 'rgba(255,255,255,0.05)',
                  color: imagePreview ? '#FF6B1A' : 'rgba(255,255,255,0.35)',
                  border: imagePreview ? '1px solid rgba(255,107,26,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  opacity: uploadState === 'uploading' ? 0.5 : 1,
                }}
              >
                <ImagePlus size={15} />
                {imagePreview ? 'Cambiar foto' : 'Foto'}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePost}
                disabled={!canPost}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: canPost
                    ? 'linear-gradient(135deg, #FF6B1A 0%, #FFA052 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: canPost ? 'white' : 'rgba(255,255,255,0.2)',
                  boxShadow: canPost ? '0 8px 24px rgba(255,107,26,0.45)' : 'none',
                  border: canPost ? '1px solid rgba(255,107,26,0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {posting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />
                }
                Publicar
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default CreatePostModal
