import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ScheduleDay } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import Loader from '../components/Loader'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7]

export default function Schedule() {
  const [week, setWeek] = useState<ScheduleDay[] | null>(null)

  useEffect(() => {
    api.scheduleWeek().then(setWeek).catch(() => setWeek([]))
  }, [])

  if (!week) return <Loader label="Загружаем расписание..." />

  const byDay = new Map<number, ScheduleDay[]>()
  for (const item of week) {
    if (!item.release) continue
    const day = item.release.publish_day?.value ?? 0
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(item)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight">Расписание выхода серий</h1>
      <div className="space-y-8">
        {DAY_ORDER.filter((d) => byDay.has(d)).map((day) => (
          <div key={day}>
            <h2 className="mono-label mb-3 text-accent-2">
              {byDay.get(day)![0].release.publish_day?.description}
            </h2>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
              {byDay.get(day)!.map((item) => (
                <AnimeCard key={item.release.id} release={item.release} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
