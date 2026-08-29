import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { isInWishlist, toggleWishlist, onWishlistChange } from '../lib/wishlist'
import type { Release } from '../../../shared/types'

export default function WishlistButton({
  release,
  size = 'md',
}: {
  release: Release
  size?: 'sm' | 'md'
}) {
  const [saved, setSaved] = useState(() => isInWishlist(release.id))

  useEffect(() => onWishlistChange(() => setSaved(isInWishlist(release.id))), [release.id])

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSaved(toggleWishlist(release))
  }

  const dims = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.8 }}
      animate={saved ? { scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.35 }}
      title={saved ? 'Убрать из понравившегося' : 'Добавить в понравившееся'}
      className={`flex ${dims} items-center justify-center rounded-full transition-colors ${
        saved ? 'bg-accent-2/20 text-accent-2' : 'bg-black/60 text-white/70 hover:bg-black/80'
      }`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7-5.4-4.7 7.1-.6z" />
      </svg>
    </motion.button>
  )
}
