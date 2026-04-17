"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Volume2,
  Play,
  Pause,
  AlertTriangle,
  ArrowRight,
  Headphones,
  Phone,
} from "lucide-react"
import { NOISE_AUDIO_URLS, NOISE_LABELS, type NoiseType } from "@/lib/test-data"

interface AudioCheckCardProps {
  onPass: () => void
  onBack: () => void
}

// Only the noise types that have actual audio files (silence is, well, silence).
const CHECK_NOISES: NoiseType[] = ["white-noise", "cafe", "music"]

const NOISE_DESCRIPTIONS: Record<NoiseType, string> = {
  silence: "No sound",
  "white-noise": "A steady hissing / shhh sound",
  cafe: "Background chatter in a cafe",
  music: "A short clip of music",
}

export function AudioCheckCard({ onPass, onBack }: AudioCheckCardProps) {
  const audiosRef = useRef<Record<string, HTMLAudioElement>>({})
  const [playingId, setPlayingId] = useState<NoiseType | null>(null)
  const [heard, setHeard] = useState<Record<NoiseType, boolean>>({
    silence: false,
    "white-noise": false,
    cafe: false,
    music: false,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    CHECK_NOISES.forEach((noise) => {
      const audio = new Audio(NOISE_AUDIO_URLS[noise])
      audio.loop = true
      audio.preload = "auto"
      audio.addEventListener("error", () =>
        setError(
          `Unable to load the "${NOISE_LABELS[noise]}" audio file. Please check your connection.`
        )
      )
      audiosRef.current[noise] = audio
    })

    return () => {
      Object.values(audiosRef.current).forEach((a) => {
        a.pause()
      })
      audiosRef.current = {}
    }
  }, [])

  const pauseAll = () => {
    Object.values(audiosRef.current).forEach((a) => a.pause())
  }

  const handleToggle = async (noise: NoiseType) => {
    const audio = audiosRef.current[noise]
    if (!audio) return
    try {
      if (playingId === noise) {
        audio.pause()
        setPlayingId(null)
      } else {
        pauseAll()
        await audio.play()
        setPlayingId(noise)
        setError(null)
      }
    } catch {
      setError(
        "Your browser blocked audio playback. Please allow sound for this site and try again."
      )
    }
  }

  const handleContinue = () => {
    pauseAll()
    onPass()
  }

  const allHeard = useMemo(
    () => CHECK_NOISES.every((n) => heard[n]),
    [heard]
  )

  return (
    <div className="text-left">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Headphones className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3 text-balance text-center"
      >
        Audio Check
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base text-pretty max-w-md mx-auto text-center"
      >
        Play each sample and check the box once you can hear it clearly. You
        must confirm all three before starting the study.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-2 mb-5 sm:mb-6 p-3 rounded-xl bg-accent/20 text-accent-foreground max-w-sm mx-auto"
      >
        <Volume2 className="w-5 h-5 text-primary shrink-0" />
        <span className="text-sm sm:text-base font-medium text-left">
          Turn your volume up, or put on headphones.
        </span>
      </motion.div>

      {/* Per-sound check rows */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="space-y-3 mb-5 sm:mb-6"
      >
        {CHECK_NOISES.map((noise) => {
          const isPlaying = playingId === noise
          return (
            <div
              key={noise}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-secondary/40"
            >
              <Button
                onClick={() => handleToggle(noise)}
                size="icon"
                variant={isPlaying ? "secondary" : "default"}
                className="rounded-full shrink-0 w-10 h-10 sm:w-11 sm:h-11"
                aria-label={
                  isPlaying
                    ? `Pause ${NOISE_LABELS[noise]}`
                    : `Play ${NOISE_LABELS[noise]}`
                }
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {NOISE_LABELS[noise]}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {NOISE_DESCRIPTIONS[noise]}
                </p>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 h-3 mt-1"
                    aria-hidden="true"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-primary rounded-full"
                        animate={{ height: ["20%", "100%", "20%"] }}
                        transition={{
                          duration: 0.7,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                        style={{ height: "20%" }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              <label
                htmlFor={`heard-${noise}`}
                className="flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Checkbox
                  id={`heard-${noise}`}
                  checked={heard[noise]}
                  onCheckedChange={(v) =>
                    setHeard((prev) => ({ ...prev, [noise]: v === true }))
                  }
                />
                <span className="text-xs sm:text-sm text-foreground/90 whitespace-nowrap">
                  I can hear it
                </span>
              </label>
            </div>
          )
        })}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm mb-5"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Contact note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/10 mb-5 sm:mb-6"
      >
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
          <span className="font-semibold">Note:</span> If there are continued
          sound difficulties, please reach out to{" "}
          <span className="font-medium">Marianne Leon</span> at{" "}
          <a
            href="tel:+14085128782"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            (408) 512-8782
          </a>
          .
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <Button
          variant="ghost"
          onClick={() => {
            pauseAll()
            onBack()
          }}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!allHeard}
          size="lg"
          className="rounded-full px-6 sm:px-8 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  )
}
