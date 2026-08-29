import { useState, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { login, error, clearError } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(loginValue, password, remember)
      onClose()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.form
          initial={{ opacity: 0, scale: 0.96, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.97, y: 6, filter: 'blur(4px)' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          onClick={(e) => e.stopPropagation()}
          onSubmit={onSubmit}
          className="my-auto max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-surface-raised p-6 shadow-2xl"
        >
          <h2 className="text-lg font-bold tracking-tight">Вход в AniLiberty</h2>
          <p className="mt-1 text-xs text-white/40">
            Используй логин и пароль своего аккаунта на aniliberty.top
          </p>

          <div className="mt-4 space-y-3">
            <input
              value={loginValue}
              onChange={(e) => {
                setLoginValue(e.target.value)
                clearError()
              }}
              placeholder="Логин или email"
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError()
              }}
              type="password"
              placeholder="Пароль"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
            <label className="flex items-center gap-2 text-xs text-white/50">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#FF3D5A]"
              />
              Запомнить меня
            </label>
          </div>

          {error && <p className="mt-3 text-xs text-accent">{error}</p>}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-white/5 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !loginValue || !password}
              className="flex-1 rounded-full bg-accent-gradient py-2 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            >
              {submitting ? '...' : 'Войти'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
