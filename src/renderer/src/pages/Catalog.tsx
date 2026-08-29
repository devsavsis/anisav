import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api'
import type { CatalogFilters, Genre, Release, ValueDescription } from '../../../shared/types'
import AnimeCard from '../components/AnimeCard'
import { GridSkeleton } from '../components/Skeleton'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }

type SortOpt = ValueDescription & { label: string }

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const searchQ = params.get('search') || ''
  const genreQ = params.get('genre')

  const [refGenres, setRefGenres] = useState<Genre[]>([])
  const [refTypes, setRefTypes] = useState<ValueDescription[]>([])
  const [refSeasons, setRefSeasons] = useState<ValueDescription[]>([])
  const [refSorting, setRefSorting] = useState<SortOpt[]>([])

  const [selectedGenres, setSelectedGenres] = useState<number[]>(genreQ ? [Number(genreQ)] : [])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [sorting, setSorting] = useState('FRESH_AT_DESC')
  const [page, setPage] = useState(1)

  const [results, setResults] = useState<Release[] | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.refGenres().then(setRefGenres).catch(() => {})
    api.refTypes().then(setRefTypes).catch(() => {})
    api.refSeasons().then(setRefSeasons).catch(() => {})
    api.refSorting().then(setRefSorting).catch(() => {})
  }, [])

  useEffect(() => {
    if (genreQ) setSelectedGenres([Number(genreQ)])
  }, [genreQ])

  const filters: CatalogFilters = useMemo(
    () => ({
      genres: selectedGenres.length ? selectedGenres : undefined,
      types: selectedTypes.length ? selectedTypes : undefined,
      seasons: selectedSeasons.length ? selectedSeasons : undefined,
      search: searchQ || undefined,
      sorting,
    }),
    [selectedGenres, selectedTypes, selectedSeasons, searchQ, sorting]
  )

  useEffect(() => {
    setLoading(true)
    setResults(null)
    if (searchQ) {
      api
        .search(searchQ)
        .then((data) => {
          setResults(data)
          setTotalPages(1)
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
      return
    }
    api
      .catalog(filters, page, 24)
      .then((res) => {
        setResults(res.data)
        setTotalPages(res.meta.pagination.total_pages)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [filters, page, searchQ])

  function toggle(list: number[], value: number, set: (v: number[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
    setPage(1)
  }
  function toggleStr(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight">
        {searchQ ? `Поиск: «${searchQ}»` : 'Каталог'}
      </h1>

      <div className="flex gap-6">
        {!searchQ && (
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="w-56 shrink-0 space-y-5 text-sm"
          >
            <FilterGroup title="Сортировка">
              <select
                value={sorting}
                onChange={(e) => {
                  setSorting(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded bg-white/5 px-2 py-1.5 text-xs outline-none"
              >
                {refSorting.map((s) => (
                  <option key={s.value} value={s.value} className="bg-surface">
                    {s.label}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup title="Тип">
              {refTypes.map((t) => (
                <Check
                  key={t.value}
                  label={t.description}
                  checked={selectedTypes.includes(t.value)}
                  onChange={() => toggleStr(selectedTypes, t.value, setSelectedTypes)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Сезон">
              {refSeasons.map((s) => (
                <Check
                  key={s.value}
                  label={s.description}
                  checked={selectedSeasons.includes(s.value)}
                  onChange={() => toggleStr(selectedSeasons, s.value, setSelectedSeasons)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Жанры">
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {refGenres.map((g) => (
                  <Check
                    key={g.id}
                    label={g.name}
                    checked={selectedGenres.includes(g.id)}
                    onChange={() => toggle(selectedGenres, g.id, setSelectedGenres)}
                  />
                ))}
              </div>
            </FilterGroup>

            <AnimatePresence>
              {(selectedGenres.length > 0 || selectedTypes.length > 0 || selectedSeasons.length > 0) && (
                <motion.button
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelectedGenres([])
                    setSelectedTypes([])
                    setSelectedSeasons([])
                    setParams({})
                    setPage(1)
                  }}
                  className="text-xs text-white/40 hover:text-white"
                >
                  Сбросить фильтры
                </motion.button>
              )}
            </AnimatePresence>
          </motion.aside>
        )}

        <div className="flex-1">
          {loading && <GridSkeleton count={18} />}
          {!loading && results && results.length === 0 && (
            <p className="py-16 text-center text-white/40">Ничего не найдено</p>
          )}
          {!loading && results && results.length > 0 && (
            <>
              <motion.div
                key={`${JSON.stringify(filters)}-${page}`}
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
              >
                {results.map((r) => (
                  <AnimeCard key={r.id} release={r} />
                ))}
              </motion.div>

              {!searchQ && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-full bg-white/5 px-4 py-1.5 transition-colors hover:bg-white/10 disabled:opacity-30"
                  >
                    Назад
                  </button>
                  <span className="font-mono text-xs tabular-nums text-white/50">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full bg-white/5 px-4 py-1.5 transition-colors hover:bg-white/10 disabled:opacity-30"
                  >
                    Далее
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mono-label mb-2 text-white/40">{title}</h3>
      {children}
    </div>
  )
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-0.5 text-white/70 hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-[#FF3D5A]"
      />
      <span className="text-xs">{label}</span>
    </label>
  )
}
