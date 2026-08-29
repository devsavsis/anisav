import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, imageUrl } from '../lib/api'
import type { Genre } from '../../../shared/types'
import Loader from '../components/Loader'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } }
const tile = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function Genres() {
  const [genres, setGenres] = useState<Genre[] | null>(null)

  useEffect(() => {
    api.genres().then(setGenres).catch(() => setGenres([]))
  }, [])

  if (!genres) return <Loader label="Загружаем жанры..." />

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight">Жанры</h1>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      >
        {genres.map((g) => (
          <motion.div key={g.id} variants={tile} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
            <Link
              to={`/catalog?genre=${g.id}`}
              className="group relative block h-24 overflow-hidden rounded-lg bg-surface-card"
            >
              {g.image?.preview && (
                <motion.img
                  src={imageUrl(g.image.optimized?.preview || g.image.preview)}
                  alt=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  whileHover={{ opacity: 0.6, scale: 1.08 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-3">
                <p className="font-semibold tracking-tight">{g.name}</p>
                {g.total_releases != null && (
                  <p className="mono-label text-white/50">{g.total_releases} тайтлов</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
