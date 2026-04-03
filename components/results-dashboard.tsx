"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ArrowLeft, Users, Clock, Brain, Trash2 } from "lucide-react"
import { useTestStore } from "@/lib/use-test-store"
import { NOISE_LABELS, NOISE_COLORS, type NoiseType, type ParticipantData } from "@/lib/test-data"

interface ResultsDashboardProps {
  onBack: () => void
  isEmbedded?: boolean
}

const chartConfig: ChartConfig = {
  silence: {
    label: "Silence",
    color: "var(--chart-1)",
  },
  "white-noise": {
    label: "White Noise",
    color: "var(--chart-2)",
  },
  cafe: {
    label: "Cafe Ambience",
    color: "var(--chart-3)",
  },
  music: {
    label: "Music (Kids – MGMT)",
    color: "var(--chart-5)",
  },
}

export function ResultsDashboard({ onBack, isEmbedded }: ResultsDashboardProps) {
  const { participants, clearAllData, isLoaded } = useTestStore()

  const completedParticipants = useMemo(
    () => participants.filter((p) => p.completed),
    [participants]
  )

  // Calculate average time by noise type for pie chart
  const timeByNoiseType = useMemo(() => {
    const totals: Record<NoiseType, { time: number; count: number }> = {
      silence: { time: 0, count: 0 },
      "white-noise": { time: 0, count: 0 },
      cafe: { time: 0, count: 0 },
      music: { time: 0, count: 0 },
    }

    completedParticipants.forEach((p) => {
      p.results.forEach((r) => {
        if (!totals[r.noiseType]) return // skip legacy noise types no longer in use
        totals[r.noiseType].time += r.timeTakenMs
        totals[r.noiseType].count += 1
      })
    })

    return Object.entries(totals)
      .filter(([, data]) => data.count > 0)
      .map(([type, data]) => ({
        name: type,
        label: NOISE_LABELS[type as NoiseType],
        value: Math.round(data.time / data.count / 1000), // average seconds
        fill: NOISE_COLORS[type as NoiseType],
      }))
  }, [completedParticipants])

  // Calculate words remembered by noise type for bar chart
  const wordsByNoiseType = useMemo(() => {
    const totals: Record<NoiseType, { correct: number; total: number; count: number }> = {
      silence: { correct: 0, total: 0, count: 0 },
      "white-noise": { correct: 0, total: 0, count: 0 },
      cafe: { correct: 0, total: 0, count: 0 },
      music: { correct: 0, total: 0, count: 0 },
    }

    completedParticipants.forEach((p) => {
      p.results.forEach((r) => {
        if (!totals[r.noiseType]) return // skip legacy noise types no longer in use
        totals[r.noiseType].correct += r.correctCount
        totals[r.noiseType].total += r.totalWords
        totals[r.noiseType].count += 1
      })
    })

    return Object.entries(totals)
      .filter(([, data]) => data.count > 0)
      .map(([type, data]) => ({
        name: NOISE_LABELS[type as NoiseType],
        avgCorrect: Number((data.correct / data.count).toFixed(1)),
        fill: NOISE_COLORS[type as NoiseType],
      }))
  }, [completedParticipants])

  // Stats summary
  const stats = useMemo(() => {
    const totalParticipants = completedParticipants.length
    const totalResponses = completedParticipants.reduce((sum, p) => sum + p.results.length, 0)
    const avgAccuracy =
      totalResponses > 0
        ? (
            (completedParticipants.reduce(
              (sum, p) => sum + p.results.reduce((s, r) => s + r.correctCount / r.totalWords, 0),
              0
            ) /
              totalResponses) *
            100
          ).toFixed(1)
        : "0"
    const avgTime =
      totalResponses > 0
        ? (
            completedParticipants.reduce(
              (sum, p) => sum + p.results.reduce((s, r) => s + r.timeTakenMs, 0),
              0
            ) /
            totalResponses /
            1000
          ).toFixed(1)
        : "0"

    return { totalParticipants, totalResponses, avgAccuracy, avgTime }
  }, [completedParticipants])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    )
  }

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-background"}>
      {/* Header */}
      {!isEmbedded && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
                <h1 className="text-xl font-bold text-foreground">Results Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Experiment data and analytics
                </p>
              </div>
            </div>
            {completedParticipants.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllData}
                className="rounded-full text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            )}
          </div>
        </motion.header>
      )}

      <main className={isEmbedded ? "" : "max-w-7xl mx-auto px-4 py-8"}>
        {completedParticipants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Results Yet</h2>
            <p className="text-muted-foreground mb-6">
              Complete the experiment to see your results here
            </p>
            <Button onClick={onBack} className="rounded-full">
              Take the Experiment
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalParticipants}
                      </p>
                      <p className="text-sm text-muted-foreground">Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent/20">
                      <Brain className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.avgAccuracy}%
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-chart-3/20">
                      <Clock className="w-5 h-5 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.avgTime}s
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-chart-4/20">
                      <Brain className="w-5 h-5 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalResponses}
                      </p>
                      <p className="text-sm text-muted-foreground">Responses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Pie Chart - Time by Noise Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Average Response Time by Noise Type</CardTitle>
                    <CardDescription>
                      How long participants took to recall words (in seconds)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => `${value}s avg`}
                            />
                          }
                        />
                        <Pie
                          data={timeByNoiseType}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          label={({ label, value }) => `${value}s`}
                          labelLine={false}
                        >
                          {timeByNoiseType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bar Chart - Words Remembered */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Words Remembered by Noise Type</CardTitle>
                    <CardDescription>
                      Average correct words recalled per test
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={wordsByNoiseType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 5]} />
                        <YAxis dataKey="name" type="category" width={100} tickLine={false} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => `${value} words avg`}
                            />
                          }
                        />
                        <Bar
                          dataKey="avgCorrect"
                          radius={[0, 8, 8, 0]}
                        >
                          {wordsByNoiseType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Individual Participant Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Individual Participant Results</CardTitle>
                  <CardDescription>
                    Detailed breakdown for each test-taker
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedParticipants.map((participant, pIdx) => (
                      <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        index={pIdx}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}

function ParticipantCard({
  participant,
  index,
}: {
  participant: ParticipantData
  index: number
}) {
  const totalCorrect = participant.results.reduce((sum, r) => sum + r.correctCount, 0)
  const totalWords = participant.results.reduce((sum, r) => sum + r.totalWords, 0)
  const accuracy = ((totalCorrect / totalWords) * 100).toFixed(1)
  const avgTime = (
    participant.results.reduce((sum, r) => sum + r.timeTakenMs, 0) /
    participant.results.length /
    1000
  ).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {index + 1}
          </div>
          <div>
            <p className="font-medium text-foreground">Participant {index + 1}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(participant.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Badge variant="secondary" className="rounded-full">
            {accuracy}% accuracy
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {avgTime}s avg
          </Badge>
        </div>
      </div>

      {/* Results by test */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {participant.results.map((result, rIdx) => (
          <div
            key={rIdx}
            className="text-center p-2 rounded-lg bg-card"
            title={`Test ${rIdx + 1}: ${result.correctCount}/${result.totalWords} words - ${NOISE_LABELS[result.noiseType]}`}
          >
            <div
              className="w-full h-2 rounded-full mb-1"
              style={{ backgroundColor: NOISE_COLORS[result.noiseType] }}
            />
            <p className="text-xs font-medium">
              {result.correctCount}/{result.totalWords}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
