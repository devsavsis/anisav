import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import type { CollectionType, Release } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import Loader from '../components/Loader'

const TABS: Array<{ key: CollectionType | 'FAVORITES'; label: string }> = [
  { key: 'WATCHING', label: 'Смотрю' },
  { key: 'PLANNED', label: 'Запланировано' },
  { key: 'WATCHED', label: 'Просмотрено' },
  { key: 'POSTPONED', label: 'Отложено' },
  { key: 'ABANDONED', label: 'Брошено' },
  { key: 'FAVORITES', label: 'Избранное' },
]

export default function MyLists() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('WATCHING')
  const [releases, setReleases] = useState<Release[] | null>(null)

  useEffect(() => {
    if (!user) return
    setReleases(null)
    const req =
      tab === 'FAVORITES'
        ? window.anisav.favoritesList(1, 48)
        : window.anisav.collectionList(tab, 1, 48)
    req.then((res) => setReleases(res.data)).catch(() => setReleases([]))
  }, [tab, user])

  if (authLoading) return <Loader />
  if (!user) return <p className="py-24 text-center text-white/40">Войдите, чтобы видеть свои списки</p>

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight">Мои списки</h1>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'text-white' : 'text-white/60 hover:text-white/90'
            }`}
          >
            {tab === t.key && (
              <motion.span
                layoutId="mylists-tab-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 rounded-full bg-accent-gradient"
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!releases && <Loader key="loader" />}
        {releases && releases.length === 0 && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center text-white/40"
          >
            Список пуст
          </motion.p>
        )}
        {releases && releases.length > 0 && (
          <motion.div
            key={tab}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
            className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
          >
            {releases.map((r) => (
              <motion.div
                key={r.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              >
                <AnimeCard release={r} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
