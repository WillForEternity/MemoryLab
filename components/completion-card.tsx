"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PartyPopper, BarChart3, Home } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth"

interface CompletionCardProps {
  onViewResults: () => void
  onGoHome: () => void
}

const confettiColors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"]

export function CompletionCard({ onViewResults, onGoHome }: CompletionCardProps) {
  const { isAdmin } = useAdminAuth()

  // Pre-compute stable random positions so re-renders don't scramble the animation
  const confetti = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left: `${5 + Math.random() * 90}%`,
        endY: -(50 + Math.random() * 150),
        endX: (Math.random() - 0.5) * 120,
        rotate: Math.random() * 540 - 270,
        delay: i * 0.08,
        color: confettiColors[i % confettiColors.length],
      })),
    []
  )

  return (
    <div className="text-center">
      {/* Confetti burst — particles start at bottom-center and fan upward */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: c.endY,
              x: c.endX,
              scale: [0, 1, 1, 0.5],
              rotate: c.rotate,
            }}
            transition={{
              duration: 1.8,
              delay: c.delay,
              ease: "easeOut",
            }}
            className="absolute bottom-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 rounded-full"
            style={{ backgroundColor: c.color, left: c.left }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
      >
        <PartyPopper className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 text-balance"
      >
        Thanks for contributing to our experiment!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 text-pretty max-w-md mx-auto"
      >
        Your responses have been recorded and will help us understand how
        background sounds affect memory recall.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
      >
        {isAdmin && (
          <Button
            onClick={onViewResults}
            size="lg"
            className="rounded-full px-6 sm:px-8 font-medium shadow-lg text-sm sm:text-base"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            View Results
          </Button>
        )}
        <Button
          onClick={onGoHome}
          variant="outline"
          size="lg"
          className="rounded-full px-6 sm:px-8 font-medium text-sm sm:text-base"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Back to Home
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-2xl bg-secondary/50"
      >
        <p className="text-xs sm:text-sm text-muted-foreground">
          Want to share this experiment with others? Send them this link!
        </p>
      </motion.div>
    </div>
  )
}
