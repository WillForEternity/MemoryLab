"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ResultsDashboard } from "./results-dashboard"

interface AdminPanelProps {
  onBack: () => void
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              View experiment results
            </p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <ResultsDashboard onBack={() => {}} isEmbedded />
      </main>
    </div>
  )
}
