"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Volume2, Eye } from "lucide-react"
import type { VideoTest, NoiseType } from "@/lib/test-data"
import { NOISE_LABELS, NOISE_AUDIO_URLS, MUSIC_YOUTUBE_ID } from "@/lib/test-data"

interface VideoPlayerCardProps {
  video: VideoTest
  onComplete: () => void
  videoIndex: number
  totalVideos: number
}

// Extend Window for YouTube IFrame API
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}
interface YTPlayer { destroy(): void; setVolume(v: number): void }

// Loads the YouTube IFrame API script (once).
let ytApiLoaded = false
let ytApiReady = false
const ytReadyCallbacks: (() => void)[] = []

function ensureYTApi(cb: () => void) {
  if (ytApiReady) { cb(); return }
  ytReadyCallbacks.push(cb)
  if (ytApiLoaded) return
  ytApiLoaded = true
  const tag = document.createElement("script")
  tag.src = "https://www.youtube.com/iframe_api"
  document.head.appendChild(tag)
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true
    ytReadyCallbacks.forEach((fn) => fn())
    ytReadyCallbacks.length = 0
  }
}

// Starts the appropriate ambient sound for a noise type.
// - Cafe: streamed via HTMLAudioElement with Web Audio API gain boost.
// - White noise: generated via Web Audio API.
// - Music: played via YouTube IFrame API (Kids – MGMT).
// Returns a stop function. Must be called inside a user-gesture handler.
function startAmbientSound(noiseType: NoiseType, preloaded?: HTMLAudioElement | null): (() => void) | null {
  if (noiseType === "silence") return null

  // Music condition: use YouTube IFrame API
  if (noiseType === "music") {
    // Container must have real dimensions and be in the viewport for autoplay to work.
    // We hide it visually with opacity:0 and pointer-events:none instead of offscreen positioning.
    const container = document.createElement("div")
    container.style.cssText = "position:fixed;bottom:0;left:0;width:320px;height:180px;opacity:0;pointer-events:none;z-index:-1"
    document.body.appendChild(container)
    let player: YTPlayer | null = null
    let destroyed = false
    ensureYTApi(() => {
      if (!window.YT || destroyed) return
      player = new window.YT.Player(container, {
        width: 320,
        height: 180,
        videoId: MUSIC_YOUTUBE_ID,
        playerVars: { autoplay: 1, controls: 0, start: 120, playsinline: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => { e.target.setVolume(70) },
        },
      } as Record<string, unknown>)
    })
    return () => {
      destroyed = true
      player?.destroy()
      container.remove()
    }
  }

  const url = NOISE_AUDIO_URLS[noiseType]

  if (url) {
    const audio = preloaded ?? new Audio(url)
    audio.loop = true
    audio.volume = 1.0
    void audio.play()
    return () => { audio.pause(); audio.src = "" }
  }

  // White noise: generated via Web Audio API (flat spectrum, instant start)
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null

  const ctx = new AudioContextClass()
  const n = Math.ceil(ctx.sampleRate * 3)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf; src.loop = true
  const gain = ctx.createGain(); gain.gain.value = 0.08
  src.connect(gain); gain.connect(ctx.destination); src.start()

  return () => { void ctx.close() }
}

export function VideoPlayerCard({ video, onComplete, videoIndex, totalVideos }: VideoPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasWatched, setHasWatched] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [showingWords, setShowingWords] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const stopAudioRef = useRef<(() => void) | null>(null)
  const preloadedAudioRef = useRef<HTMLAudioElement | null>(null)

  // Preload audio on mount so playback is instant on click
  useEffect(() => {
    if (video.noiseType === "music") {
      ensureYTApi(() => {})
    }
    const url = NOISE_AUDIO_URLS[video.noiseType]
    if (url) {
      const audio = new Audio(url)
      audio.preload = "auto"
      audio.load()
      preloadedAudioRef.current = audio
    }
    return () => {
      if (preloadedAudioRef.current) {
        preloadedAudioRef.current.pause()
        preloadedAudioRef.current.src = ""
        preloadedAudioRef.current = null
      }
    }
  }, [video.noiseType])

  // Countdown → word sequence timing
  // Audio is started in handlePlay (user gesture) and tracked via stopAudioRef.
  // This effect only manages the countdown and word intervals — it does NOT
  // touch audio in its cleanup so React re-runs don't kill the sound.
  const wordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isPlaying) return

    setCountdown(3)
    let tick = 3

    countdownIntervalRef.current = setInterval(() => {
      tick -= 1
      if (tick <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        setCountdown(null)
        setShowingWords(true)
        setCurrentWordIndex(0)

        wordIntervalRef.current = setInterval(() => {
          setCurrentWordIndex((prev) => {
            if (prev >= video.words.length - 1) {
              if (wordIntervalRef.current) clearInterval(wordIntervalRef.current)
              setTimeout(() => {
                if (stopAudioRef.current) {
                  stopAudioRef.current()
                  stopAudioRef.current = null
                }
                setIsPlaying(false)
                setHasWatched(true)
                setShowingWords(false)
              }, 750)
              return prev
            }
            return prev + 1
          })
        }, 750)
      } else {
        setCountdown(tick)
      }
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current)
      // Do NOT stop audio here — it's managed by handlePlay / the word-end callback
    }
  }, [isPlaying, video.words.length])

  const handlePlay = () => {
    if (hasWatched) return
    // Start sound in user-gesture handler (browser autoplay policy)
    stopAudioRef.current = startAmbientSound(video.noiseType, preloadedAudioRef.current)
    setIsPlaying(true)
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 sm:mb-6"
      >
        <span className="text-sm font-medium text-muted-foreground">
          Test {videoIndex + 1} of {totalVideos}
        </span>
        <span className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
          <Volume2 className="w-4 h-4" />
          {NOISE_LABELS[video.noiseType]}
        </span>
      </motion.div>

      {/* Word Display Area */}
      <motion.div
        layout
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-secondary to-muted mb-4 sm:mb-6"
      >
        <AnimatePresence mode="wait">
          {!isPlaying && !hasWatched && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary shadow-lg flex items-center justify-center cursor-pointer"
                onClick={handlePlay}
              >
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground ml-1" />
              </motion.div>
              <p className="mt-3 sm:mt-4 text-muted-foreground font-medium text-sm sm:text-base">Click to start</p>
            </motion.div>
          )}

          {isPlaying && countdown !== null && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5"
            >
              <motion.span
                key={countdown}
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary"
              >
                {countdown}
              </motion.span>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground font-medium">
                Get ready...
              </p>
            </motion.div>
          )}

          {isPlaying && showingWords && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5"
            >
              <AnimatePresence mode="popLayout">
                {currentWordIndex >= 0 && currentWordIndex < video.words.length && (
                  <motion.span
                    key={currentWordIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.08 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground"
                  >
                    {video.words[currentWordIndex]}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Word progress indicator */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2">
                {video.words.map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                      idx <= currentWordIndex ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {hasWatched && !isPlaying && (
            <motion.div
              key="watched"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2 sm:mb-3"
              >
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </motion.div>
              <p className="text-foreground font-semibold text-sm sm:text-base">Sequence Complete</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Time to recall the words!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {hasWatched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button
              onClick={onComplete}
              size="lg"
              className="rounded-full px-6 sm:px-8 font-medium shadow-lg text-sm sm:text-base"
            >
              Continue to Questions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasWatched && !isPlaying && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4"
        >
          Remember: Each sequence plays only once
        </motion.p>
      )}
    </div>
  )
}
