"use client"

import { useState, useEffect, useCallback } from "react"
import type { ParticipantData, TestResult } from "./test-data"

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxBW4xqLHdIvni7RnGlyw7ICaxWJVtT8bGYhkBW5KwGOkRWvW-0uKef0iKApqLfaOji/exec"

async function submitToSheets(participant: ParticipantData) {
  const payload = {
    id: participant.id,
    timestamp: participant.timestamp,
    results: participant.results.map((r) => ({
      ...r,
    })),
  }
  // Google Apps Script requires no-cors + text/plain to avoid preflight failures
  await fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  })
}

const STORAGE_KEY = "memory-lab-participants"

function generateId(): string {
  return `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function useTestStore() {
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [currentParticipant, setCurrentParticipant] = useState<ParticipantData | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setParticipants(parsed.map((p: ParticipantData) => ({
            ...p,
            timestamp: new Date(p.timestamp)
          })))
        } catch (e) {
          console.error("Failed to parse stored data", e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage when participants change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(participants))
    }
  }, [participants, isLoaded])

  const startNewSession = useCallback(() => {
    const newParticipant: ParticipantData = {
      id: generateId(),
      timestamp: new Date(),
      results: [],
      completed: false,
    }
    setCurrentParticipant(newParticipant)
    return newParticipant
  }, [])

  const addResult = useCallback((result: TestResult) => {
    setCurrentParticipant((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        results: [...prev.results, result],
      }
    })
  }, [])

  const completeSession = useCallback(() => {
    if (currentParticipant) {
      const completedParticipant = {
        ...currentParticipant,
        completed: true,
      }
      setParticipants((prev) => [...prev, completedParticipant])
      setCurrentParticipant(null)
      // Fire-and-forget — don't block the UI on the network request
      void submitToSheets(completedParticipant)
      return completedParticipant
    }
    return null
  }, [currentParticipant])

  const clearAllData = useCallback(() => {
    setParticipants([])
    setCurrentParticipant(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return {
    participants,
    currentParticipant,
    isLoaded,
    startNewSession,
    addResult,
    completeSession,
    clearAllData,
  }
}
