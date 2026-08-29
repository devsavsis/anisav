import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Release } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import WishlistButton from './WishlistButton'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function AnimeCard({ release }: { release: Release }) {
  const poster = imageUrl(release.poster?.optimized?.preview || release.poster?.preview)
  const title = release.name.main

  return (
    <motion.div variants={cardVariants}>
      <Link to={`/title/${release.alias || release.id}`} className="poster-card group block">
        <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface-raised ring-1 ring-white/5">
          {poster && (
            <motion.img
              src={poster}
              alt={title}
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.06 }}
              className="h-full w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            {release.is_ongoing && (
              <span className="mono-label rounded bg-accent-gradient px-1.5 py-0.5 text-white shadow">
                Онгоинг
              </span>
            )}
            {release.age_rating?.is_adult && (
              <span className="mono-label rounded bg-black/70 px-1.5 py-0.5">
                {release.age_rating.label}
              </span>
            )}
          </div>

          {release.episodes_total != null && (
            <span className="mono-label absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5">
              {release.episodes_total} эп.
            </span>
          )}

          <div className="absolute right-1.5 top-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <WishlistButton release={release} size="sm" />
          </div>

          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-2.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">{title}</p>
          </div>
        </div>
        <div className="pt-2 transition-opacity duration-150 group-hover:opacity-0">
          <p className="line-clamp-2 text-sm font-medium leading-tight text-white/90">{title}</p>
          <p className="mt-0.5 text-xs text-white/40">
            {release.season?.description} {release.year} · {release.type?.description}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
