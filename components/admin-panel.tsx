"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { ResultsDashboard } from "./results-dashboard"
import type { ParticipantData } from "@/lib/test-data"

interface AdminPanelProps {
  onBack: () => void
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/participants", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Fetch failed: ${res.status}`)
      }
      const data = await res.json()
      const list: ParticipantData[] = (data.participants ?? []).map((p: ParticipantData) => ({
        ...p,
        timestamp: new Date(p.timestamp),
      }))
      setParticipants(list)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchParticipants()
  }, [fetchParticipants])

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update
    const prev = participants
    setParticipants((list) => list.filter((p) => p.id !== id))
    try {
      const res = await fetch(`/api/participants?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
    } catch (e) {
      setParticipants(prev)
      alert(`Delete failed: ${(e as Error).message}`)
    }
  }, [participants])

  const handleToggleMuted = useCallback(async (id: string, muted: boolean) => {
    const prev = participants
    setParticipants((list) => list.map((p) => (p.id === id ? { ...p, muted } : p)))
    try {
      const res = await fetch("/api/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, muted }),
      })
      if (!res.ok) throw new Error(`Mute failed: ${res.status}`)
    } catch (e) {
      setParticipants(prev)
      alert(`Mute failed: ${(e as Error).message}`)
    }
  }, [participants])

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
                Live data from Google Sheet
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchParticipants}
            disabled={isLoading}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <strong>Error loading data:</strong> {error}
          </div>
        )}
        <ResultsDashboard
          onBack={() => {}}
          isEmbedded
          participantsOverride={participants}
          onDeleteParticipant={handleDelete}
          onToggleMuted={handleToggleMuted}
          isLoadingOverride={isLoading}
        />
      </main>
    </div>
  )
}
