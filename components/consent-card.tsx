"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ShieldCheck,
  Volume2,
  Phone,
  Lock,
  Info,
  ArrowRight,
} from "lucide-react"

interface ConsentCardProps {
  onAgree: () => void
  onDecline: () => void
}

const SAMPLE_ID = "123xyz"

export function ConsentCard({ onAgree, onDecline }: ConsentCardProps) {
  const [device, setDevice] = useState(false)
  const [volume, setVolume] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const canContinue = useMemo(
    () => device && volume && engaged && agreed,
    [device, volume, engaged, agreed]
  )

  const numberedPoints = [
    "Participation is voluntary — you may end the study at any time by exiting the website.",
    "You will be asked to complete the experiment all the way through to the end.",
    "You can choose not to participate. No one will be forced.",
    "Although the results of the study may be published or shared, no information that could identify you will be included.",
    "Completing the survey causes no risk to you.",
  ]

  return (
    <div className="text-left">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3 text-balance text-center"
      >
        Consent to Participate
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground mb-5 sm:mb-6 text-sm sm:text-base text-pretty text-center"
      >
        Please read the following before beginning the Memory Lab study.
      </motion.p>

      {/* Purpose */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 sm:p-5 rounded-2xl bg-secondary/50 mb-4 sm:mb-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm sm:text-base text-foreground/90 leading-relaxed">
            <p className="font-semibold mb-1">Purpose of the study</p>
            <p className="text-muted-foreground">
              This study investigates how different background sound conditions
              affect short-term memory recall. You will watch a series of short
              test videos on the Memory Lab website. There are{" "}
              <span className="font-medium text-foreground">
                4 sound conditions, each presented twice, for a total of 8 tests
              </span>
              . The full experiment typically takes about{" "}
              <span className="font-medium text-foreground">5–10 minutes</span>
              .
            </p>
          </div>
        </div>
      </motion.div>

      {/* Volume notice */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-accent/20 text-accent-foreground mb-5 sm:mb-6"
      >
        <Volume2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm sm:text-base leading-relaxed">
          <span className="font-semibold">Important:</span> Please make sure the
          volume on your device is loud enough, or use headphones, so the sound
          conditions can be experienced clearly.
        </p>
      </motion.div>

      {/* Numbered rights */}
      <motion.ol
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 sm:space-y-3 mb-4 sm:mb-5 text-sm sm:text-base"
      >
        {numberedPoints.map((text, i) => (
          <li
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40"
          >
            <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {i + 1}
            </span>
            <span className="text-foreground/90 leading-relaxed">{text}</span>
          </li>
        ))}
        <li className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
          <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            6
          </span>
          <span className="text-foreground/90 leading-relaxed">
            Questions about the research may be directed to{" "}
            <span className="font-medium text-foreground">Marianne Leon</span>{" "}
            at{" "}
            <a
              href="tel:+14085128782"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              (408) 512-8782
            </a>
            .
          </span>
        </li>
      </motion.ol>

      {/* Confidentiality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/10 mb-5 sm:mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm sm:text-base text-foreground/90 leading-relaxed">
            <p className="font-semibold mb-1">Confidential & anonymous</p>
            <p className="text-muted-foreground">
              Although we use your answers for our experiment, no additional
              information or data is taken from participants. This study is
              strictly confidential and all participants are anonymous — you are
              identified only by a generated ID, shown as{" "}
              <span className="inline-block font-mono text-xs sm:text-sm px-2 py-0.5 rounded-md bg-secondary text-foreground">
                ID: {SAMPLE_ID}
              </span>
              .
            </p>
          </div>
        </div>
      </motion.div>

      {/* Data & compensation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-7 leading-relaxed px-1"
      >
        <p className="mb-1">
          Data for this study is collected through the Memory Lab website. The
          primary data collected is the number of words remembered under each
          sound condition.
        </p>
        <p>No compensation will be provided for participating.</p>
      </motion.div>

      {/* Pre-check questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="space-y-2 mb-5 sm:mb-6"
      >
        <p className="text-sm sm:text-base font-semibold text-foreground mb-2">
          Before you begin, please confirm:
        </p>
        {[
          {
            id: "device",
            label: "Do you have a working device?",
            value: device,
            set: setDevice,
          },
          {
            id: "volume",
            label: "Is the volume of your device working?",
            value: volume,
            set: setVolume,
          },
          {
            id: "engaged",
            label: "Will you stay engaged with the video's purpose?",
            value: engaged,
            set: setEngaged,
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

      {/* Agreement */}
      <motion.label
        htmlFor="agree"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 cursor-pointer mb-5 sm:mb-6"
      >
        <Checkbox
          id="agree"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5"
        />
        <span className="text-sm sm:text-base text-foreground leading-relaxed">
          <span className="font-semibold">
            I have read and understood the information above, and I agree to
            participate in this study.
          </span>{" "}
          I understand that my participation is voluntary and I can exit at any
          time.
        </span>
      </motion.label>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <Button
          variant="ghost"
          onClick={onDecline}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          Do not participate
        </Button>
        <Button
          onClick={onAgree}
          disabled={!canContinue}
          size="lg"
          className="rounded-full px-6 sm:px-8 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agree & Continue
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-muted-foreground mt-5 sm:mt-6 text-center"
      >
        Thank you for participating in our experiment. We really appreciate your
        time and help.
      </motion.p>
    </div>
  )
}
