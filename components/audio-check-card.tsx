"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Volume2,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Headphones,
} from "lucide-react"
import { NOISE_AUDIO_URLS } from "@/lib/test-data"

interface AudioCheckCardProps {
  onPass: () => void
  onBack: () => void
}

export function AudioCheckCard({ onPass, onBack }: AudioCheckCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [canHear, setCanHear] = useState<null | boolean>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = new Audio(NOISE_AUDIO_URLS.cafe)
    audio.loop = true
    audio.preload = "auto"
    audioRef.current = audio

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () =>
      setError("Unable to load the audio file. Please check your connection.")

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("error", handleError)

    return () => {
      audio.pause()
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("error", handleError)
      audioRef.current = null
    }
  }, [])

  const handleToggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      if (audio.paused) {
        await audio.play()
        setHasPlayed(true)
        setError(null)
      } else {
        audio.pause()
      }
    } catch (err) {
      setError(
        "Your browser blocked audio playback. Please allow sound for this site and try again."
      )
    }
  }

  const handleContinue = () => {
    audioRef.current?.pause()
    onPass()
  }

  const canContinue = hasPlayed && canHear === true

  return (
    <div className="text-center">
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
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3 text-balance"
      >
        Audio Check
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base text-pretty max-w-md mx-auto"
      >
        Let's make sure your audio is working before the study begins. Press
        play to hear a sample of the cafe ambience condition.
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

      {/* Play button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-6 sm:mb-8 flex flex-col items-center gap-3"
      >
        <Button
          onClick={handleToggle}
          size="lg"
          variant={isPlaying ? "secondary" : "default"}
          className="rounded-full px-6 sm:px-8 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Pause sample
            </>
          ) : (
            <>
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {hasPlayed ? "Play again" : "Play sample"}
            </>
          )}
        </Button>

        {/* Sound wave indicator */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 h-6"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary rounded-full"
                animate={{
                  height: ["25%", "100%", "25%"],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
                style={{ height: "25%" }}
              />
            ))}
          </motion.div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm max-w-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-left">{error}</span>
          </div>
        )}
      </motion.div>

      {/* Hearing confirmation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 sm:mb-8"
      >
        <p className="text-sm sm:text-base font-semibold text-foreground mb-3">
          Can you hear the cafe ambience clearly?
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant={canHear === true ? "default" : "outline"}
            onClick={() => setCanHear(true)}
            disabled={!hasPlayed}
            className="rounded-full px-5"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Yes, I can hear it
          </Button>
          <Button
            type="button"
            variant={canHear === false ? "destructive" : "outline"}
            onClick={() => setCanHear(false)}
            disabled={!hasPlayed}
            className="rounded-full px-5"
          >
            No, I can't
          </Button>
        </div>
        {!hasPlayed && (
          <p className="text-xs text-muted-foreground mt-3">
            Press play first so you can tell if the audio works.
          </p>
        )}
        {canHear === false && (
          <p className="text-xs sm:text-sm text-destructive mt-3 max-w-md mx-auto">
            Please check that your device is not muted, that your volume is
            turned up, and that the correct output (speakers or headphones) is
            selected. Then press play again.
          </p>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
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
