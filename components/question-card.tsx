"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowRight, CheckCircle2, XCircle } from "lucide-react"
import type { VideoTest, TestResult } from "@/lib/test-data"

interface QuestionCardProps {
  video: VideoTest
  onSubmit: (result: Omit<TestResult, "testId" | "noiseType" | "presentationOrder" | "targetWords">) => void
  onNext: () => void
  isLastVideo: boolean
  videoIndex: number
  totalVideos: number
}

export function QuestionCard({ video, onSubmit, onNext, isLastVideo, videoIndex, totalVideos }: QuestionCardProps) {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [startTime] = useState(Date.now())
  const [result, setResult] = useState<{
    rememberedWords: string[]
    correctWords: string[]
    incorrectWords: string[]
  } | null>(null)

  const handleSubmit = () => {
    const endTime = Date.now()
    const timeTakenMs = endTime - startTime

    // Parse input into words
    const inputWords = input
      .toLowerCase()
      .split(/[\s,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0)

    // Check which words are correct
    const correctWords = inputWords.filter((w) =>
      video.words.some((vw) => vw.toLowerCase() === w)
    )
    const incorrectWords = inputWords.filter(
      (w) => !video.words.some((vw) => vw.toLowerCase() === w)
    )

    setResult({
      rememberedWords: inputWords,
      correctWords,
      incorrectWords,
    })

    onSubmit({
      rememberedWords: inputWords,
      timeTakenMs,
      correctCount: correctWords.length,
      totalWords: video.words.length,
    })

    setSubmitted(true)
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 sm:mb-6"
      >
        <span className="text-sm font-medium text-muted-foreground">
          Test {videoIndex + 1} of {totalVideos}
        </span>
        <Badge variant="outline" className="rounded-full">
          Recall Phase
        </Badge>
      </motion.div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 text-center text-balance"
            >
              What words do you remember?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 text-center"
            >
              Type all the words you can recall, separated by commas or spaces
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 sm:mb-6"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type here..."
                className="min-h-[100px] sm:min-h-[120px] rounded-2xl text-base sm:text-lg resize-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleSubmit}
                size="lg"
                className="rounded-full px-6 sm:px-8 font-medium shadow-lg text-sm sm:text-base"
                disabled={input.trim().length === 0}
              >
                Submit Answer
                <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </motion.div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Answer Submitted!</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              You remembered{" "}
              <span className="font-semibold text-primary">
                {result?.correctWords.length ?? 0}
              </span>{" "}
              out of {video.words.length} words
            </p>

            {/* Show results */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {result && result.correctWords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-1.5 sm:gap-2 justify-center"
                >
                  {result.correctWords.map((word, idx) => (
                    <Badge
                      key={idx}
                      className="rounded-full bg-green-100 text-green-700 hover:bg-green-200 text-xs sm:text-sm"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {word}
                    </Badge>
                  ))}
                </motion.div>
              )}

              {result && result.incorrectWords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-wrap gap-1.5 sm:gap-2 justify-center"
                >
                  {result.incorrectWords.map((word, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="rounded-full text-muted-foreground text-xs sm:text-sm"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      {word}
                    </Badge>
                  ))}
                </motion.div>
              )}

              {/* Show missed words */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="pt-2"
              >
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Words you missed:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                  {video.words
                    .filter(
                      (w) =>
                        !result?.correctWords.some(
                          (cw) => cw.toLowerCase() === w.toLowerCase()
                        )
                    )
                    .map((word, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="rounded-full text-xs sm:text-sm"
                      >
                        {word}
                      </Badge>
                    ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={onNext}
                size="lg"
                className="rounded-full px-6 sm:px-8 font-medium shadow-lg text-sm sm:text-base"
              >
                {isLastVideo ? "Finish Experiment" : "Next Test"}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
