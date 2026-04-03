"use client"

import { useState, useCallback } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { TutorialCard } from "./tutorial-card"
import { VideoPlayerCard } from "./video-player-card"
import { QuestionCard } from "./question-card"
import { CompletionCard } from "./completion-card"
import { buildSessionTests, type TestResult, type VideoTest } from "@/lib/test-data"
import { useTestStore } from "@/lib/use-test-store"

type FlowState = "tutorial" | "video" | "question" | "complete"

interface TestFlowProps {
  onViewResults: () => void
  onGoHome: () => void
}

export function TestFlow({ onViewResults, onGoHome }: TestFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>("tutorial")
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  // Each session gets a fresh random set: 8 word lists drawn from a pool of 16,
  // randomly paired with noise conditions, with word order shuffled.
  const [shuffledTests, setShuffledTests] = useState<VideoTest[]>(() => buildSessionTests())
  const { startNewSession, addResult, completeSession } = useTestStore()

  const currentVideo = shuffledTests[currentVideoIndex]

  const handleStartExperiment = useCallback(() => {
    // Build a fresh random session
    setShuffledTests(buildSessionTests())
    setCurrentVideoIndex(0)
    startNewSession()
    setFlowState("video")
  }, [startNewSession])

  const handleVideoComplete = useCallback(() => {
    setFlowState("question")
  }, [])

  const handleQuestionSubmit = useCallback(
    (result: Omit<TestResult, "testId" | "noiseType" | "presentationOrder" | "targetWords">) => {
      addResult({
        ...result,
        testId: currentVideo.id,
        noiseType: currentVideo.noiseType,
        targetWords: currentVideo.words,
        presentationOrder: currentVideoIndex,
      })
    },
    [addResult, currentVideo, currentVideoIndex]
  )

  const handleNextVideo = useCallback(() => {
    if (currentVideoIndex >= shuffledTests.length - 1) {
      completeSession()
      setFlowState("complete")
    } else {
      setCurrentVideoIndex((prev) => prev + 1)
      setFlowState("video")
    }
  }, [currentVideoIndex, shuffledTests.length, completeSession])

  const cardVariants: Variants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -20,
      transition: { duration: 0.2 }
    },
  }

  return (
    <div className="w-full max-w-2xl mx-auto relative min-h-[500px] sm:min-h-[550px] flex items-center justify-center px-4 sm:px-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${flowState}-${currentVideoIndex}`}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-card text-card-foreground shadow-xl w-full p-5 sm:p-8 md:p-12 relative overflow-hidden rounded-3xl"
        >
          {flowState === "tutorial" && (
            <TutorialCard onStart={handleStartExperiment} />
          )}

          {flowState === "video" && (
            <VideoPlayerCard
              video={currentVideo}
              onComplete={handleVideoComplete}
              videoIndex={currentVideoIndex}
              totalVideos={shuffledTests.length}
            />
          )}

          {flowState === "question" && (
            <QuestionCard
              video={currentVideo}
              onSubmit={handleQuestionSubmit}
              onNext={handleNextVideo}
              isLastVideo={currentVideoIndex >= shuffledTests.length - 1}
              videoIndex={currentVideoIndex}
              totalVideos={shuffledTests.length}
            />
          )}

          {flowState === "complete" && (
            <CompletionCard
              onViewResults={onViewResults}
              onGoHome={onGoHome}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
