"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ShieldCheck, ArrowRight } from "lucide-react"

interface EligibilityGateProps {
  onPass: () => void
}

export function EligibilityGate({ onPass }: EligibilityGateProps) {
  const [adult, setAdult] = useState(false)
  const [citizen, setCitizen] = useState(false)
  const [denied, setDenied] = useState(false)

  const canContinue = useMemo(() => adult && citizen, [adult, citizen])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { type: "spring", stiffness: 300, damping: 25 },
        }}
        className="w-full max-w-md bg-card text-card-foreground shadow-xl rounded-3xl p-6 sm:p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center"
        >
          Quick eligibility check
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 text-center"
        >
          Before entering Memory Lab, please confirm the following:
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 mb-6"
        >
          {[
            {
              id: "adult",
              label: "I am over the age of 18.",
              value: adult,
              set: setAdult,
            },
            {
              id: "citizen",
              label: "I am a U.S. citizen.",
              value: citizen,
              set: setCitizen,
            },
          ].map((q) => (
            <label
              key={q.id}
              htmlFor={q.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-pointer"
            >
              <Checkbox
                id={q.id}
                checked={q.value}
                onCheckedChange={(v) => q.set(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                {q.label}
              </span>
            </label>
          ))}
        </motion.div>

        {denied && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs sm:text-sm text-center"
          >
            You must be at least 18 and a U.S. citizen to participate in this
            study.
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={() => {
              if (canContinue) onPass()
              else setDenied(true)
            }}
            disabled={!canContinue}
            size="lg"
            className="w-full rounded-full text-base font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enter Memory Lab
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
