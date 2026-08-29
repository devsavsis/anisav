export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] w-full rounded-xl bg-white/5" />
      <div className="mt-2 h-3 w-4/5 rounded bg-white/5" />
      <div className="mt-1.5 h-2.5 w-2/5 rounded bg-white/5" />
    </div>
  )
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
