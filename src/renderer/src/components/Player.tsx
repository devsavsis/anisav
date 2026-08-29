import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import type { Episode } from '../../../shared/types'
import { loadPlayerPrefs, savePlayerPrefs, PlayerPrefs } from '../lib/playerPrefs'

const QUALITIES = [
  { key: 'hls_1080', label: '1080p' },
  { key: 'hls_720', label: '720p' },
  { key: 'hls_480', label: '480p' },
] as const

interface Props {
  episode: Episode
  resumeAt?: number
  onProgress?: (time: number) => void
  onEnded?: () => void
}

function fmt(t: number) {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Player({ episode, resumeAt, onProgress, onEnded }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skippedRanges = useRef<Set<string>>(new Set())
  const didAutoFullscreen = useRef(false)

  const available = QUALITIES.filter((q) => episode[q.key])
  const [quality, setQuality] = useState(available[0]?.key)
  const [prefs, setPrefs] = useState<PlayerPrefs>(loadPlayerPrefs)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showSkip, setShowSkip] = useState<'opening' | 'ending' | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)

  function updatePrefs(patch: Partial<PlayerPrefs>) {
    setPrefs((p) => {
      const next = { ...p, ...patch }
      savePlayerPrefs(next)
      return next
    })
  }

  useEffect(() => {
    setQuality(available[0]?.key)
    skippedRanges.current = new Set()
    didAutoFullscreen.current = false
  }, [episode.id])

  useEffect(() => {
    const video = videoRef.current
    const src = quality ? episode[quality] : undefined
    if (!video || !src) return

    hlsRef.current?.destroy()

    if (Hls.isSupported()) {
      const hls = new Hls({
        manifestLoadingMaxRetry: 6,
        levelLoadingMaxRetry: 6,
        fragLoadingMaxRetry: 8,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad(video.currentTime)
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError()
            break
          default:
            hls.destroy()
            break
        }
      })
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    }

    const onLoaded = () => {
      if (resumeAt && resumeAt > 5) video.currentTime = resumeAt
    }
    video.addEventListener('loadedmetadata', onLoaded)

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [quality, episode.id])

  const reportProgress = useCallback(() => {
    const video = videoRef.current
    if (video && onProgress && video.currentTime > 3) onProgress(video.currentTime)
  }, [onProgress])

  useEffect(() => {
    const id = setInterval(reportProgress, 10_000)
    return () => clearInterval(id)
  }, [reportProgress])

  function onTimeUpdate() {
    const video = videoRef.current
    if (!video) return
    setCurrent(video.currentTime)

    const t = video.currentTime
    const checkSkip = (range: Episode['opening'], key: string, prefKey: keyof PlayerPrefs) => {
      if (!range || t < range.start || t >= range.stop) return false
      if (prefs[prefKey] && !skippedRanges.current.has(key)) {
        skippedRanges.current.add(key)
        video.currentTime = range.stop
        return false
      }
      return !prefs[prefKey]
    }

    if (checkSkip(episode.opening, 'opening', 'autoSkipOpening')) setShowSkip('opening')
    else if (checkSkip(episode.ending, 'ending', 'autoSkipEnding')) setShowSkip('ending')
    else setShowSkip(null)
  }

  function skip() {
    const video = videoRef.current
    if (!video) return
    if (showSkip === 'opening' && episode.opening) video.currentTime = episode.opening.stop
    if (showSkip === 'ending' && episode.ending) video.currentTime = episode.ending.stop
    setShowSkip(null)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  function onPlay() {
    setPlaying(true)
    if (prefs.autoFullscreen && !didAutoFullscreen.current && !document.fullscreenElement) {
      didAutoFullscreen.current = true
      wrapperRef.current?.requestFullscreen().catch(() => {})
    }
  }

  function onEndedInternal() {
    setPlaying(false)
    reportProgress()
    if (prefs.autoPlayNext) onEnded?.()
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else wrapperRef.current?.requestFullscreen().catch(() => {})
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  function seekBy(delta: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + delta))
  }

  function wakeControls() {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setControlsVisible(false)
    }, 2800)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!wrapperRef.current?.contains(document.activeElement) && document.activeElement !== document.body)
        return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          seekBy(10)
          break
        case 'ArrowLeft':
          seekBy(-10)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [duration])

  useEffect(() => {
    return () => reportProgress()
  }, [episode.id])

  return (
    <div
      ref={wrapperRef}
      onMouseMove={wakeControls}
      className="group relative overflow-hidden rounded-lg bg-black"
      tabIndex={0}
    >
      <video
        ref={videoRef}
        autoPlay
        onClick={togglePlay}
        onPlay={onPlay}
        onPause={() => setPlaying(false)}
        onEnded={onEndedInternal}
        onTimeUpdate={onTimeUpdate}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
        className="aspect-video w-full cursor-pointer bg-black"
      />

      {showSkip && (
        <button
          onClick={skip}
          className="absolute bottom-20 right-4 flex items-center gap-1.5 rounded-lg bg-black/70 px-4 py-2 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-accent-gradient"
        >
          <SkipIcon />
          Пропустить {showSkip === 'opening' ? 'опенинг' : 'эндинг'}
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 ${
          controlsVisible || !playing ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (videoRef.current) videoRef.current.currentTime = v
            setCurrent(v)
          }}
          className="player-seek w-full"
          style={{ ['--progress' as string]: `${duration ? (current / duration) * 100 : 0}%` }}
        />

        <div className="mt-1 flex items-center gap-3">
          <button onClick={togglePlay} className="text-white/90 hover:text-white">
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={toggleMute} className="text-white/90 hover:text-white">
            {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (videoRef.current) {
                videoRef.current.volume = v
                videoRef.current.muted = v === 0
              }
              setVolume(v)
              setMuted(v === 0)
            }}
            className="player-seek w-16"
            style={{ ['--progress' as string]: `${(muted ? 0 : volume) * 100}%` }}
          />

          <span className="text-xs tabular-nums text-white/70">
            {fmt(current)} / {fmt(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="text-white/90 hover:text-white"
              >
                <GearIcon />
              </button>
              {showSettings && (
                <div
                  onMouseLeave={() => setShowSettings(false)}
                  className="glass absolute bottom-full right-0 mb-2 w-64 space-y-3 rounded-xl border border-white/10 p-3 text-sm shadow-2xl"
                >
                  {available.length > 1 && (
                    <SettingsRow label="Качество">
                      <div className="flex gap-1">
                        {available.map((q) => (
                          <button
                            key={q.key}
                            onClick={() => setQuality(q.key)}
                            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                              quality === q.key ? 'bg-accent-gradient' : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </SettingsRow>
                  )}

                  <div className="border-t border-white/10 pt-2 font-mono text-[11px] text-white/40">
                    Пробел — пауза, ←/→ — перемотка 10с, F — экран, M — звук
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-2">
                    <ToggleRow
                      label="Пропускать опенинг"
                      checked={prefs.autoSkipOpening}
                      onChange={(v) => updatePrefs({ autoSkipOpening: v })}
                    />
                    <ToggleRow
                      label="Пропускать эндинг"
                      checked={prefs.autoSkipEnding}
                      onChange={(v) => updatePrefs({ autoSkipEnding: v })}
                    />
                    <ToggleRow
                      label="Авто-воспроизведение"
                      checked={prefs.autoPlayNext}
                      onChange={(v) => updatePrefs({ autoPlayNext: v })}
                    />
                    <ToggleRow
                      label="Авто-полноэкранный режим"
                      checked={prefs.autoFullscreen}
                      onChange={(v) => updatePrefs({ autoFullscreen: v })}
                    />
                  </div>
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="text-white/90 hover:text-white">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between text-left"
    >
      <span className="text-white/70">{label}</span>
      <span
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-accent-gradient' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}
function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
    </svg>
  )
}
function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.7 3 2.1-2.1-1.4-1.4L15.3 10l-2.1-2.1-1.4 1.4L14 11l-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4L16.7 12z" />
    </svg>
  )
}
function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.4 13a7.6 7.6 0 0 0 .1-1 7.6 7.6 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.7l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a7.4 7.4 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.7L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.7l2 3.4a.5.5 0 0 0 .6.2l2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.7L19.4 13zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
    </svg>
  )
}
function SkipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 4v16l12-8L5 4zm13 0v16h2V4h-2z" />
    </svg>
  )
}
