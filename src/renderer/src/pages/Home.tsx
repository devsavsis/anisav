import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../lib/api'
import { getContinueWatching, ContinueWatchingItem } from '../lib/continueWatching'
import type { Release, ScheduleDay } from '../../../shared/types'
import Row from '../components/Row'
import { GridSkeleton } from '../components/Skeleton'

export default function Home() {
  const [latest, setLatest] = useState<Release[] | null>(null)
  const [recommended, setRecommended] = useState<Release[] | null>(null)
  const [today, setToday] = useState<ScheduleDay[] | null>(null)
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])

  useEffect(() => {
    api.latest(21).then(setLatest).catch(() => setLatest([]))
    api.recommended(14).then(setRecommended).catch(() => setRecommended([]))
    api.scheduleNow().then((s) => setToday(s.today)).catch(() => setToday([]))
    getContinueWatching().then(setContinueWatching).catch(() => setContinueWatching([]))
  }, [])

  const hero = latest?.[0]

  if (!latest) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 h-[380px] w-full animate-pulse rounded-xl bg-white/5" />
        <GridSkeleton count={12} />
      </div>
    )
  }

  return (
    <div>
      {hero && (
        <div className="relative h-[380px] w-full overflow-hidden">
          <motion.img
            src={imageUrl(hero.poster?.optimized?.preview || hero.poster?.preview)}
            alt=""
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 0.45, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-8"
          >
            <span className="mono-label mb-2 w-fit rounded bg-accent-gradient px-2 py-1 text-white">
              Новинка
            </span>
            <h1 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight drop-shadow">
              {hero.name.main}
            </h1>
            <p className="mt-2 max-w-xl line-clamp-2 text-sm text-white/60">{hero.description}</p>
            <Link
              to={`/title/${hero.alias || hero.id}`}
              className="mt-4 w-fit rounded-full bg-accent-gradient px-5 py-2 text-sm font-semibold transition-transform hover:scale-105"
            >
              Смотреть
            </Link>
          </motion.div>
        </div>
      )}

      {continueWatching.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-5">
          <h2 className="mb-3 text-lg font-bold">Продолжить просмотр</h2>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7"
          >
            {continueWatching.map((c) => (
              <motion.div
                key={c.episode.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <Link to={`/title/${c.release.alias || c.release.id}`} className="poster-card group block">
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface-raised shadow-md shadow-black/30 ring-1 ring-white/5">
                    <img
                      src={imageUrl(c.release.poster?.optimized?.preview || c.release.poster?.preview)}
                      alt={c.release.name.main}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="mono-label mb-1 truncate text-white/80">
                        Серия {c.episode.ordinal}
                      </p>
                      {c.episode.duration && (
                        <div className="h-0.5 w-full overflow-hidden rounded bg-black/40">
                          <div
                            className="h-full bg-accent-gradient"
                            style={{ width: `${Math.min(100, (c.time / c.episode.duration) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight text-white/90">
                    {c.release.name.main}
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <Row title="Онгоинги сегодня" releases={today?.map((s) => s.release).filter(Boolean) ?? []} />
      <Row title="Последние обновления" releases={latest} />
      <Row title="Рекомендуем" releases={recommended ?? []} />
    </div>
  )
}
