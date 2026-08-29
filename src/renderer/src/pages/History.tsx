import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import type { HistoryItem } from '../../../shared/types'
import { imageUrl } from '../lib/api'
import Loader from '../components/Loader'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function History() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<HistoryItem[] | null>(null)

  useEffect(() => {
    if (!user) return
    window.anisav
      .historyList()
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
  }, [user])

  if (authLoading) return <Loader />
  if (!user) return <p className="py-24 text-center text-white/40">Войдите, чтобы видеть историю просмотра</p>
  if (!items) return <Loader />

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight">История просмотра</h1>
      {items.length === 0 && <p className="py-16 text-center text-white/40">История пуста</p>}
      <div className="space-y-2">
        {items.filter((item) => item.release && item.release_episode).map((item) => (
          <Link
            key={item.id}
            to={`/title/${item.release.alias || item.release.id}`}
            className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 transition-colors hover:bg-white/10"
          >
            <img
              src={imageUrl(item.release.poster?.optimized?.thumbnail || item.release.poster?.thumbnail)}
              alt=""
              className="h-16 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.release.name.main}</p>
              <p className="text-xs text-white/40">
                Серия {item.release_episode.ordinal}
                {item.release_episode.name ? ` — ${item.release_episode.name}` : ''}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-white/30">{formatDate(item.updated_at)}</p>
            </div>
            {item.is_watched ? (
              <span className="mono-label shrink-0 rounded bg-white/10 px-2 py-1 text-white/50">
                Просмотрено
              </span>
            ) : (
              <span className="mono-label shrink-0 rounded bg-accent-soft px-2 py-1 text-accent">
                В процессе
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
