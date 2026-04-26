"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ShieldCheck, ArrowRight } from "lucide-react"

interface EligibilityGateProps {
  onPass: () => void
}

export function EligibilityGate({ onPass }: EligibilityGateProps) {
  const [ageInput, setAgeInput] = useState("")
  const [residingInUS, setResidingInUS] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAge = useMemo(() => {
    const trimmed = ageInput.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null
  }, [ageInput])

  const ageValid = parsedAge !== null && parsedAge >= 18 && parsedAge <= 120
  const canContinue = ageValid && residingInUS

  const handleSubmit = () => {
    if (parsedAge === null) {
      setError("Please enter your age.")
      return
    }
    if (parsedAge < 18) {
      setError("You must be at least 18 years old to participate in this study.")
      return
    }
    if (parsedAge > 120) {
      setError("Please enter a valid age.")
      return
    }
    if (!residingInUS) {
      setError(
        "You must currently reside in the United States to participate in this study."
      )
      return
    }
    onPass()
  }

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

        {/* Age input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3"
        >
          <label
            htmlFor="age"
            className="block text-sm sm:text-base font-medium text-foreground mb-1.5"
          >
            How old are you?
          </label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            placeholder="Enter your age"
            value={ageInput}
            onChange={(e) => {
              setAgeInput(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit()
            }}
            className="rounded-xl"
          />
        </motion.div>

        {/* Residency */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-5"
        >
          <label
            htmlFor="residing-us"
            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-pointer"
          >
            <Checkbox
              id="residing-us"
              checked={residingInUS}
              onCheckedChange={(v) => {
                setResidingInUS(v === true)
                setError(null)
              }}
              className="mt-0.5"
            />
            <span className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              Are you currently residing in the United States?
            </span>
          </label>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs sm:text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSubmit}
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
