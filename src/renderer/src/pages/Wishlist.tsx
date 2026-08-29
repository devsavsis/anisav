import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getWishlist, onWishlistChange } from '../lib/wishlist'
import type { Release } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }

export default function Wishlist() {
  const [items, setItems] = useState<Release[]>(() => getWishlist())

  useEffect(() => onWishlistChange(() => setItems(getWishlist())), [])

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Понравилось</h1>
      <p className="mb-4 font-mono text-[11px] text-white/40">
        Локальный список на этом устройстве — не требует входа в аккаунт AniLiberty
      </p>

      {items.length === 0 && (
        <p className="py-16 text-center text-white/40">
          Пока пусто — нажми на звёздочку у тайтла, чтобы добавить сюда
        </p>
      )}

      {items.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        >
          {items.map((r) => (
            <AnimeCard key={r.id} release={r} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
