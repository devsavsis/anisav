import { motion } from 'framer-motion'
import type { Release } from '../../../shared/types'
import AnimeCard from './AnimeCard'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export default function Row({ title, releases }: { title: string; releases: Release[] }) {
  if (!releases.length) return null
  return (
    <section className="mx-auto max-w-7xl px-6 py-5">
      <h2 className="mb-3 text-lg font-bold tracking-tight">{title}</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6"
      >
        {releases.map((r) => (
          <AnimeCard key={r.id} release={r} />
        ))}
      </motion.div>
    </section>
  )
}
