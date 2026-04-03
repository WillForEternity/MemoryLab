"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Brain, Eye, Clock, Volume2 } from "lucide-react"

interface TutorialCardProps {
  onStart: () => void
}

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
}

const listVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
}

export function TutorialCard({ onStart }: TutorialCardProps) {
  const steps = [
    {
      icon: Volume2,
      title: "Listen & Read",
      description: "Each test plays a different background sound while 10 words flash on screen",
    },
    {
      icon: Brain,
      title: "Remember the Words",
      description: "Pay close attention and try to memorize as many words as you can",
    },
    {
      icon: Eye,
      title: "One Chance Only",
      description: "Each sequence plays only once, so stay focused",
    },
    {
      icon: Clock,
      title: "Recall & Submit",
      description: "After each sequence, type the words you remember and submit your answer",
    },
  ]

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3 text-balance"
      >
        Welcome to Memory Lab
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground mb-4 sm:mb-6 text-base sm:text-lg text-pretty"
      >
        Help us understand how background sounds affect memory recall
      </motion.p>

      {/* Volume reminder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center justify-center gap-2 mb-4 sm:mb-6 p-3 rounded-xl bg-accent/20 text-accent-foreground"
      >
        <Volume2 className="w-5 h-5 text-primary" />
        <span className="text-sm sm:text-base font-medium">Please turn up your volume before starting</span>
      </motion.div>

      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 text-left"
      >
        {steps.map((step, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <motion.div
              variants={iconVariants}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
            >
              <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">{step.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onStart}
          size="lg"
          className="rounded-full px-6 sm:px-8 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          Start Experiment
          <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-muted-foreground mt-4 sm:mt-6"
      >
        8 tests &middot; 10 words each &middot; 4 sound conditions
      </motion.p>
    </div>
  )
}
