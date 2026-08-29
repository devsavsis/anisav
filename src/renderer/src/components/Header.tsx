import { useState, FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'
import LoginModal from './LoginModal'
import { useAuth } from '../lib/AuthContext'
import { imageUrl } from '../lib/api'

const NAV = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/schedule', label: 'Расписание' },
  { to: '/genres', label: 'Жанры' },
  { to: '/wishlist', label: 'Понравилось' },
]

export default function Header() {
  const [query, setQuery] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/catalog?search=${encodeURIComponent(q)}`)
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="font-mono text-sm font-bold tracking-widest">
            ANI<span className="text-accent">SAV</span>
          </span>
        </Link>

        <nav className="hidden gap-1 text-sm font-medium text-white/60 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="relative px-3 py-1.5 transition-colors hover:text-white">
              {location.pathname === n.to && (
                <motion.span
                  layoutId="nav-active"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-white/8"
                />
              )}
              <span className={`relative ${location.pathname === n.to ? 'text-white' : ''}`}>{n.label}</span>
            </Link>
          ))}
          {user && (
            <>
              <Link to="/lists" className="px-3 py-1.5 transition-colors hover:text-white">
                Мои списки
              </Link>
              <Link to="/history" className="px-3 py-1.5 transition-colors hover:text-white">
                История
              </Link>
            </>
          )}
        </nav>

        <form onSubmit={onSubmit} className="ml-auto w-full max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск аниме..."
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm outline-none placeholder:text-white/30 focus:border-accent/60"
          />
        </form>

        {user ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 hover:bg-white/10"
            >
              {user.avatar?.preview ? (
                <img
                  src={imageUrl(user.avatar.optimized?.preview || user.avatar.preview)}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gradient text-xs font-bold">
                  {user.nickname[0]?.toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium">{user.nickname}</span>
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
                  transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
                  onMouseLeave={() => setMenuOpen(false)}
                  className="glass absolute right-0 top-full z-10 mt-2 w-44 origin-top-right overflow-hidden rounded-xl border border-white/10 shadow-2xl"
                >
                  <Link
                    to="/lists"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-white/5 md:hidden"
                  >
                    Мои списки
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-white/5 md:hidden"
                  >
                    История
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-accent hover:bg-white/5"
                  >
                    Выйти
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="shrink-0 rounded-full bg-accent-gradient px-4 py-1.5 text-sm font-semibold transition-transform hover:scale-105"
          >
            Войти
          </button>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  )
}
