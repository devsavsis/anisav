import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import type { CollectionType } from '../../../shared/types'

const LABELS: Record<CollectionType, string> = {
  WATCHING: 'Смотрю',
  PLANNED: 'Запланировано',
  WATCHED: 'Просмотрено',
  POSTPONED: 'Отложено',
  ABANDONED: 'Брошено',
}

function extractCollectionType(items: unknown, releaseId: number): CollectionType | null {
  if (!Array.isArray(items)) return null
  for (const item of items) {
    if (item && typeof item === 'object' && 'release_id' in item && 'type_of_collection' in item) {
      const o = item as { release_id: number; type_of_collection: CollectionType }
      if (o.release_id === releaseId) return o.type_of_collection
    }
  }
  return null
}

function extractIsFavorite(items: unknown, releaseId: number): boolean {
  if (!Array.isArray(items)) return false
  return items.some((item) => {
    if (typeof item === 'number') return item === releaseId
    if (item && typeof item === 'object' && 'release_id' in item) {
      return (item as { release_id: number }).release_id === releaseId
    }
    return false
  })
}

export default function AddToListButton({ releaseId }: { releaseId: number }) {
  const { user } = useAuth()
  const [collectionType, setCollectionType] = useState<CollectionType | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    window.anisav
      .collectionIds()
      .then((ids) => setCollectionType(extractCollectionType(ids, releaseId)))
      .catch(() => {})
    window.anisav
      .favoriteIds()
      .then((ids) => setIsFavorite(extractIsFavorite(ids, releaseId)))
      .catch(() => {})
  }, [user, releaseId])

  if (!user) return null

  async function pick(type: CollectionType) {
    setBusy(true)
    try {
      await window.anisav.collectionAdd(releaseId, type)
      setCollectionType(type)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function removeFromList() {
    setBusy(true)
    try {
      await window.anisav.collectionRemove(releaseId)
      setCollectionType(null)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function toggleFavorite() {
    setBusy(true)
    try {
      if (isFavorite) await window.anisav.favoriteRemove(releaseId)
      else await window.anisav.favoriteAdd(releaseId)
      setIsFavorite(!isFavorite)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.button
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          whileTap={{ scale: 0.96 }}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-transform ${
            collectionType ? 'bg-white/10 hover:bg-white/15' : 'bg-accent-gradient hover:scale-105'
          }`}
        >
          {collectionType ? LABELS[collectionType] : '+ Добавить в список'}
        </motion.button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              onMouseLeave={() => setOpen(false)}
              className="glass absolute left-0 top-full z-10 mt-1 w-44 origin-top overflow-hidden rounded-xl border border-white/10 shadow-xl"
            >
              {(Object.keys(LABELS) as CollectionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => pick(t)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${
                    collectionType === t ? 'text-accent' : ''
                  }`}
                >
                  {LABELS[t]}
                </button>
              ))}
              {collectionType && (
                <button
                  onClick={removeFromList}
                  className="block w-full border-t border-white/5 px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5"
                >
                  Убрать из списка
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={toggleFavorite}
        disabled={busy}
        whileTap={{ scale: 0.85 }}
        animate={isFavorite ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isFavorite ? 'bg-accent-soft text-accent' : 'bg-white/5 text-white/50 hover:bg-white/10'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.button>
    </div>
  )
}
