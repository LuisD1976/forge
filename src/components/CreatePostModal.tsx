import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImagePlus, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserStore } from '../store/userStore'
import { useSocialStore } from '../store/socialStore'
import { createSocialPost, uploadPostImage } from '../services/socialService'
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

    // Revoke previous preview URL
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

    // Reset input so same file can be re-selected
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
    } catch {
      // optimistic post already shown — silent fail
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
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="fixed z-50 rounded-3xl overflow-hidden w-full"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          maxWidth: 480, margin: '0 16px',
          backgroundColor: '#13131A',
          border: '1px solid #252530',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #252530' }}>
          <span className="font-semibold text-forge-white">Nueva publicación</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-forge-white/40 hover:text-forge-white transition-colors"
            style={{ backgroundColor: '#252530' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-forge-border flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-forge-orange/30 flex items-center justify-center text-forge-orange font-bold">
                    {user?.username?.[0]?.toUpperCase() ?? 'T'}
                  </div>
              }
            </div>
            <div>
              <div className="font-semibold text-forge-white text-sm">{user?.displayName ?? 'Tú'}</div>
              <div className="text-xs text-forge-white/40">@{user?.username ?? 'usuario'}</div>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Cómo fue el entreno? Comparte tu progreso..."
            className="w-full bg-transparent text-forge-white/90 text-sm leading-relaxed outline-none resize-none placeholder:text-forge-white/25"
            rows={4}
            maxLength={500}
            autoFocus
          />
          <div className="text-right text-xs mt-1 mb-3" style={{ color: content.length > 400 ? '#FF6B1A' : 'rgba(240,240,236,0.2)' }}>
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
                <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Upload overlay */}
                  {uploadState === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="text-white animate-spin" />
                        <span className="text-white text-xs font-medium">Subiendo…</span>
                      </div>
                    </div>
                  )}

                  {uploadState === 'done' && (
                    <div
                      className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(74,222,128,0.9)', color: '#052e16' }}
                    >
                      <CheckCircle size={12} />
                      Subida
                    </div>
                  )}

                  {uploadState === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle size={24} className="text-red-400" />
                        <span className="text-red-300 text-xs font-medium">Error al subir</span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-forge-orange underline"
                        >
                          Reintentar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #252530' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === 'uploading'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: imagePreview ? 'rgba(255,107,26,0.1)' : '#252530',
                color: imagePreview ? '#FF6B1A' : 'rgba(240,240,236,0.4)',
                opacity: uploadState === 'uploading' ? 0.5 : 1,
              }}
            >
              <ImagePlus size={14} />
              {imagePreview ? 'Cambiar foto' : 'Foto'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePost}
              disabled={!canPost}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: canPost ? 'linear-gradient(135deg, #FF6B1A, #FFA052)' : '#252530',
                color: canPost ? 'white' : '#6B7280',
                boxShadow: canPost ? '0 4px 16px rgba(255,107,26,0.4)' : 'none',
              }}
            >
              {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publicar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default CreatePostModal
