import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, imageUrl } from '../lib/api'
import type { Episode, Release, TimecodeItem } from '../../../shared/types'
import { useAuth } from '../lib/AuthContext'
import { getAllLocalProgress, saveLocalProgress } from '../lib/localProgress'
import Loader from '../components/Loader'
import Player from '../components/Player'
import AddToListButton from '../components/AddToListButton'
import WishlistButton from '../components/WishlistButton'

function formatBytes(n: number) {
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

export default function TitleDetail() {
  const { idOrAlias } = useParams()
  const { user } = useAuth()
  const [release, setRelease] = useState<Release | null>(null)
  const [error, setError] = useState(false)
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null)
  const [timecodes, setTimecodes] = useState<Map<string, TimecodeItem>>(new Map())

  useEffect(() => {
    if (!idOrAlias) return
    setRelease(null)
    setSelectedEp(null)
    api
      .release(idOrAlias)
      .then((r) => {
        setRelease(r)
        setSelectedEp(r.episodes?.[0] ?? null)
      })
      .catch(() => setError(true))
  }, [idOrAlias])

  useEffect(() => {
    const local = getAllLocalProgress()
    const merged = new Map<string, TimecodeItem>(
      Object.entries(local).map(([id, p]) => [
        id,
        { release_episode_id: id, time: p.time, is_watched: p.is_watched },
      ])
    )
    setTimecodes(merged)

    if (!user) return
    window.anisav
      .timecodes()
      .then((items: TimecodeItem[]) => {
        setTimecodes((prev) => {
          const next = new Map(prev)
          for (const i of items) next.set(i.release_episode_id, i)
          return next
        })
      })
      .catch(() => {})
  }, [user, idOrAlias])

  const poster = useMemo(
    () => imageUrl(release?.poster?.optimized?.preview || release?.poster?.preview),
    [release]
  )

  const saveTimecode = useCallback(
    (episodeId: string, time: number, isWatched: boolean) => {
      saveLocalProgress(episodeId, time, isWatched)
      if (user) window.anisav.timecodeSave(episodeId, time, isWatched).catch(() => {})
      setTimecodes((prev) => {
        const next = new Map(prev)
        next.set(episodeId, { release_episode_id: episodeId, time, is_watched: isWatched })
        return next
      })
    },
    [user]
  )

  function goToNextEpisode() {
    if (!release?.episodes || !selectedEp) return
    const idx = release.episodes.findIndex((e) => e.id === selectedEp.id)
    const next = release.episodes[idx + 1]
    if (next) setSelectedEp(next)
  }

  if (error) return <p className="py-24 text-center text-white/40">Тайтл не найден</p>
  if (!release) return <Loader label="Загружаем..." />

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <motion.div
        key={release.id}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="flex flex-col gap-6 md:flex-row"
      >
        <motion.img
          variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
          transition={{ duration: 0.35 }}
          src={poster}
          alt={release.name.main}
          className="h-fit w-48 shrink-0 rounded-lg object-cover shadow-lg"
        />
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.35 }}
          className="min-w-0"
        >
          <h1 className="text-2xl font-extrabold tracking-tight">{release.name.main}</h1>
          {release.name.english && (
            <p className="mt-0.5 font-mono text-xs text-white/40">{release.name.english}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Chip>{release.type?.description}</Chip>
            <Chip>{release.year}</Chip>
            <Chip>{release.season?.description}</Chip>
            <Chip>{release.age_rating?.label}</Chip>
            {release.is_ongoing && <Chip accent mono>Онгоинг</Chip>}
            {release.episodes_total != null && <Chip mono>{release.episodes_total} эп.</Chip>}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <AddToListButton releaseId={release.id} />
            <WishlistButton release={release} />
          </div>

          {!!release.genres?.length && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.03, delayChildren: 0.2 } } }}
              className="mt-3 flex flex-wrap gap-1.5"
            >
              {release.genres.map((g) => (
                <motion.span
                  key={g.id}
                  variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60"
                >
                  {g.name}
                </motion.span>
              ))}
            </motion.div>
          )}

          {release.description && (
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-white/70">
              {release.description}
            </p>
          )}
        </motion.div>
      </motion.div>

      {selectedEp && (
        <div className="mt-8">
          <Player
            episode={selectedEp}
            key={selectedEp.id}
            resumeAt={timecodes.get(selectedEp.id)?.time}
            onProgress={(t) => saveTimecode(selectedEp.id, t, false)}
            onEnded={() => {
              saveTimecode(selectedEp.id, 0, true)
              goToNextEpisode()
            }}
          />
        </div>
      )}

      {!!release.episodes?.length && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-bold">Серии</h2>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.015 } } }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {release.episodes.map((ep) => {
              const tc = timecodes.get(ep.id)
              const isSelected = selectedEp?.id === ep.id
              return (
                <motion.button
                  key={ep.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedEp(ep)}
                  className={`relative overflow-hidden rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'font-semibold text-white' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="episode-active-bg"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 bg-accent-gradient"
                    />
                  )}
                  <div className="relative flex items-center gap-1.5 font-semibold">
                    Серия {ep.ordinal}
                    {tc?.is_watched && <span className="text-[10px] text-white/60">✓</span>}
                  </div>
                  {ep.name && <div className="relative truncate text-xs text-white/50">{ep.name}</div>}
                  {tc && !tc.is_watched && ep.duration && (
                    <div className="relative mt-1 h-0.5 w-full overflow-hidden rounded bg-black/30">
                      <div
                        className="h-full bg-white/60"
                        style={{ width: `${Math.min(100, (tc.time / ep.duration) * 100)}%` }}
                      />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      )}

      {!!release.torrents?.length && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Торренты</h2>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
            className="space-y-2"
          >
            {release.torrents.map((t) => (
              <motion.div
                key={t.id}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.label}</p>
                  <p className="text-xs text-white/40">
                    {formatBytes(t.size)} · {t.quality?.description} · {t.seeders} сидов
                  </p>
                </div>
                <button
                  onClick={() => window.anisav.openExternal(t.magnet)}
                  className="shrink-0 rounded-full bg-accent-gradient px-3 py-1 text-xs font-semibold transition-transform hover:scale-105"
                >
                  Magnet
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}

function Chip({
  children,
  accent,
  mono,
}: {
  children: React.ReactNode
  accent?: boolean
  mono?: boolean
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 ${mono ? 'font-mono text-[10px] uppercase tracking-widest' : 'font-semibold'} ${
        accent ? 'bg-accent-gradient text-white' : 'bg-white/10 text-white/70'
      }`}
    >
      {children}
    </span>
  )
}
