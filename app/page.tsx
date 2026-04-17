"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TestFlow } from "@/components/test-flow"
import { ResultsDashboard } from "@/components/results-dashboard"
import { AdminLoginDialog } from "@/components/admin-login-dialog"
import { AdminPanel } from "@/components/admin-panel"
import { EligibilityGate } from "@/components/eligibility-gate"
import { Button } from "@/components/ui/button"
import { Brain, Sparkles, Volume2, Lock, Shield } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth"

type View = "home" | "test" | "results" | "admin"

const ELIGIBILITY_KEY = "memory-lab-eligibility-passed"

export default function MemoryLabPage() {
  const [view, setView] = useState<View>("home")
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [eligible, setEligible] = useState(false)
  const { isAdmin } = useAdminAuth()

  useEffect(() => {
    if (typeof window === "undefined") return
    const passed = sessionStorage.getItem(ELIGIBILITY_KEY) === "true"
    setEligible(passed)
    setEligibilityChecked(true)
  }, [])

  const handleEligibilityPass = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ELIGIBILITY_KEY, "true")
    }
    setEligible(true)
  }

  if (!eligibilityChecked) {
    return <div className="min-h-screen bg-background" />
  }

  if (!eligible && !isAdmin) {
    return (
      <AnimatePresence mode="wait">
        <EligibilityGate key="eligibility" onPass={handleEligibilityPass} />
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {view === "home" && (
        <HomePage
          key="home"
          onStartTest={() => setView("test")}
          onViewResults={() => setView("results")}
          onAdminPanel={() => setView("admin")}
        />
      )}

      {view === "test" && (
        <motion.div
          key="test"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-background flex items-center justify-center p-4"
        >
          <TestFlow
            onViewResults={() => {
              if (isAdmin) setView("results")
              else setView("home")
            }}
            onGoHome={() => setView("home")}
          />
        </motion.div>
      )}

      {view === "results" && isAdmin && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ResultsDashboard onBack={() => setView("home")} />
        </motion.div>
      )}

      {view === "admin" && isAdmin && (
        <motion.div
          key="admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AdminPanel onBack={() => setView("home")} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface HomePageProps {
  onStartTest: () => void
  onViewResults: () => void
  onAdminPanel: () => void
}

function HomePage({ onStartTest, onViewResults, onAdminPanel }: HomePageProps) {
  const [loginOpen, setLoginOpen] = useState(false)
  const { isAdmin } = useAdminAuth()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-accent/5 blur-3xl"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 sm:p-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">Memory Lab</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdminPanel}
                className="rounded-full text-xs sm:text-sm"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Admin Panel
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="rounded-full text-xs sm:text-sm text-muted-foreground"
            >
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {isAdmin ? "Admin" : "Login"}
            </Button>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6 text-balance"
            >
              How Does Sound
              <br />
              <span className="text-primary">Affect Your Memory?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 text-pretty max-w-lg mx-auto px-4"
            >
              Participate in our psychology experiment to help us understand how
              different background sounds influence memory recall.
            </motion.p>

            {/* Volume reminder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-2 mb-6 sm:mb-8 p-3 rounded-xl bg-accent/20 text-accent-foreground max-w-sm mx-auto"
            >
              <Volume2 className="w-5 h-5 text-primary" />
              <span className="text-sm sm:text-base font-medium">Please turn up your volume</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onStartTest}
                size="lg"
                className="rounded-full px-8 sm:px-10 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Start Experiment
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto"
            >
              {[
                { label: "8 Tests", desc: "Word sequences" },
                { label: "5-10 min", desc: "Total time" },
                { label: "4 Types", desc: "Sound conditions" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="p-3 sm:p-4 rounded-2xl bg-card shadow-sm"
                >
                  <p className="text-sm sm:text-lg font-bold text-foreground">{item.label}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 sm:p-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs sm:text-sm text-muted-foreground"
          >
            A psychology research project studying the effects of ambient sound on memory
          </motion.p>
        </footer>
      </div>

      <AdminLoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onAdminPanel={() => {
          setLoginOpen(false)
          onAdminPanel()
        }}
      />
    </motion.div>
  )
}
