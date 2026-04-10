"use client"

import { useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ErrorBar, Cell } from "recharts"
import { ArrowLeft, Users, Clock, Brain, Trash2, Download, AlertTriangle, VolumeX, Volume2 } from "lucide-react"
import { useTestStore } from "@/lib/use-test-store"
import { NOISE_LABELS, NOISE_COLORS, type NoiseType, type ParticipantData } from "@/lib/test-data"

interface ResultsDashboardProps {
  onBack: () => void
  isEmbedded?: boolean
  /** When provided, the dashboard renders this data instead of the local store. */
  participantsOverride?: ParticipantData[]
  /** When provided, enables the per-participant delete button. */
  onDeleteParticipant?: (id: string) => void
  /** When provided, enables the per-participant mute toggle. Muted participants are excluded from aggregates. */
  onToggleMuted?: (id: string, muted: boolean) => void
  /** Loading state for overridden data. */
  isLoadingOverride?: boolean
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

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function sem(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance) / Math.sqrt(arr.length)
}

export function ResultsDashboard({
  onBack,
  isEmbedded,
  participantsOverride,
  onDeleteParticipant,
  onToggleMuted,
  isLoadingOverride,
}: ResultsDashboardProps) {
  const store = useTestStore()
  const useOverride = participantsOverride !== undefined
  const participants = useOverride ? participantsOverride : store.participants
  const clearAllData = store.clearAllData
  const isLoaded = useOverride ? !isLoadingOverride : store.isLoaded

  const completedParticipants = useMemo(
    () => participants.filter((p) => p.completed),
    [participants]
  )

  // Muted participants are visible in the list but excluded from aggregates/charts.
  const aggregatedParticipants = useMemo(
    () => completedParticipants.filter((p) => !p.muted),
    [completedParticipants]
  )

  // Collect raw values per noise type for computing means + SEM
  const raw = useMemo(() => {
    const data: Record<NoiseType, { correct: number[]; falseAlarms: number[]; timeMs: number[] }> = {
      silence: { correct: [], falseAlarms: [], timeMs: [] },
      "white-noise": { correct: [], falseAlarms: [], timeMs: [] },
      cafe: { correct: [], falseAlarms: [], timeMs: [] },
      music: { correct: [], falseAlarms: [], timeMs: [] },
    }
    aggregatedParticipants.forEach((p) => {
      p.results.forEach((r) => {
        if (!data[r.noiseType]) return
        data[r.noiseType].correct.push(r.correctCount)
        data[r.noiseType].falseAlarms.push(r.rememberedWords.length - r.correctCount)
        data[r.noiseType].timeMs.push(r.timeTakenMs)
      })
    })
    return data
  }, [aggregatedParticipants])

  // Bar chart data: words recalled
  const wordsChartData = useMemo(() => {
    return (Object.entries(raw) as [NoiseType, typeof raw.silence][])
      .filter(([, d]) => d.correct.length > 0)
      .map(([type, d]) => ({
        name: NOISE_LABELS[type],
        avgCorrect: Number(mean(d.correct).toFixed(1)),
        sem: Number(sem(d.correct).toFixed(2)),
        fill: NOISE_COLORS[type],
      }))
  }, [raw])

  // Bar chart data: false alarms
  const falseAlarmChartData = useMemo(() => {
    return (Object.entries(raw) as [NoiseType, typeof raw.silence][])
      .filter(([, d]) => d.falseAlarms.length > 0)
      .map(([type, d]) => ({
        name: NOISE_LABELS[type],
        avgFalseAlarms: Number(mean(d.falseAlarms).toFixed(1)),
        sem: Number(sem(d.falseAlarms).toFixed(2)),
        fill: NOISE_COLORS[type],
      }))
  }, [raw])

  // Bar chart data: response time (seconds)
  const timeChartData = useMemo(() => {
    return (Object.entries(raw) as [NoiseType, typeof raw.silence][])
      .filter(([, d]) => d.timeMs.length > 0)
      .map(([type, d]) => {
        const secs = d.timeMs.map((ms) => ms / 1000)
        return {
          name: NOISE_LABELS[type],
          avgTime: Number(mean(secs).toFixed(1)),
          sem: Number(sem(secs).toFixed(2)),
          fill: NOISE_COLORS[type],
        }
      })
  }, [raw])

  // Stats summary (muted participants excluded)
  const stats = useMemo(() => {
    const totalParticipants = aggregatedParticipants.length
    const totalResponses = aggregatedParticipants.reduce((sum, p) => sum + p.results.length, 0)
    const allFalseAlarms = Object.values(raw).flatMap((d) => d.falseAlarms)
    const allTimeMs = Object.values(raw).flatMap((d) => d.timeMs)

    const avgAccuracy =
      totalResponses > 0
        ? (
            (aggregatedParticipants.reduce(
              (sum, p) => sum + p.results.reduce((s, r) => s + r.correctCount / r.totalWords, 0),
              0
            ) /
              totalResponses) *
            100
          ).toFixed(1)
        : "0"
    const avgTime = allTimeMs.length > 0 ? (mean(allTimeMs) / 1000).toFixed(1) : "0"
    const avgFalseAlarms = allFalseAlarms.length > 0 ? mean(allFalseAlarms).toFixed(1) : "0"

    return { totalParticipants, totalResponses, avgAccuracy, avgTime, avgFalseAlarms }
  }, [aggregatedParticipants, raw])

  // CSV export
  const downloadCsv = useCallback(() => {
    const headers = [
      "participant_id",
      "timestamp",
      "trial_number",
      "presentation_order",
      "noise_type",
      "correct_count",
      "total_words",
      "false_alarm_count",
      "time_ms",
      "remembered_words",
      "target_words",
      "muted",
    ]
    const rows = completedParticipants.flatMap((p) =>
      p.results.map((r, i) => [
        p.id,
        new Date(p.timestamp).toISOString(),
        i + 1,
        r.presentationOrder,
        r.noiseType,
        r.correctCount,
        r.totalWords,
        r.rememberedWords.length - r.correctCount,
        r.timeTakenMs,
        `"${r.rememberedWords.join(", ")}"`,
        `"${r.targetWords.join(", ")}"`,
        p.muted ? "1" : "0",
      ])
    )
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `memory-lab-results-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCsv}
                  className="rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                {!useOverride && (
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
            )}
          </div>
        </motion.header>
      )}

      <main className={isEmbedded ? "" : "max-w-7xl mx-auto px-4 py-8"}>
        {!isLoaded ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading participant data&hellip;</p>
          </div>
        ) : completedParticipants.length === 0 ? (
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
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
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
                      <p className="text-sm text-muted-foreground">Avg Recall</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-destructive/10">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.avgFalseAlarms}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg False Alarms</p>
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

            {/* Embedded CSV export (when header is hidden) */}
            {isEmbedded && completedParticipants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-2 mb-6"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCsv}
                  className="rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                {!useOverride && (
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
              </motion.div>
            )}

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart - Words Recalled */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Words Recalled by Noise Type</CardTitle>
                    <CardDescription>
                      Mean correct words per test (error bars = ±1 SEM)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={wordsChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 10]} />
                        <YAxis dataKey="name" type="category" width={100} tickLine={false} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) =>
                                name === "avgCorrect"
                                  ? `${value} words avg`
                                  : `±${value}`
                              }
                            />
                          }
                        />
                        <Bar dataKey="avgCorrect" radius={[0, 8, 8, 0]}>
                          {wordsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <ErrorBar dataKey="sem" width={4} strokeWidth={2} stroke="var(--foreground)" />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bar Chart - False Alarms */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">False Alarms by Noise Type</CardTitle>
                    <CardDescription>
                      Mean incorrect words submitted per test (error bars = ±1 SEM)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={falseAlarmChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, "auto"]} />
                        <YAxis dataKey="name" type="category" width={100} tickLine={false} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) =>
                                name === "avgFalseAlarms"
                                  ? `${value} words avg`
                                  : `±${value}`
                              }
                            />
                          }
                        />
                        <Bar dataKey="avgFalseAlarms" radius={[0, 8, 8, 0]}>
                          {falseAlarmChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <ErrorBar dataKey="sem" width={4} strokeWidth={2} stroke="var(--foreground)" />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bar Chart - Response Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2"
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Response Time by Noise Type</CardTitle>
                    <CardDescription>
                      Mean time to submit recall (seconds, error bars = ±1 SEM)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <BarChart data={timeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, "auto"]} />
                        <YAxis dataKey="name" type="category" width={100} tickLine={false} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) =>
                                name === "avgTime"
                                  ? `${value}s avg`
                                  : `±${value}s`
                              }
                            />
                          }
                        />
                        <Bar dataKey="avgTime" radius={[0, 8, 8, 0]}>
                          {timeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <ErrorBar dataKey="sem" width={4} strokeWidth={2} stroke="var(--foreground)" />
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
                        onDelete={onDeleteParticipant}
                        onToggleMuted={onToggleMuted}
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
  onDelete,
  onToggleMuted,
}: {
  participant: ParticipantData
  index: number
  onDelete?: (id: string) => void
  onToggleMuted?: (id: string, muted: boolean) => void
}) {
  const totalCorrect = participant.results.reduce((sum, r) => sum + r.correctCount, 0)
  const totalWords = participant.results.reduce((sum, r) => sum + r.totalWords, 0)
  const totalFalseAlarms = participant.results.reduce(
    (sum, r) => sum + (r.rememberedWords.length - r.correctCount),
    0
  )
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
      className={`p-4 rounded-xl transition-colors ${
        participant.muted
          ? "bg-muted/30 opacity-60 hover:opacity-80"
          : "bg-secondary/30 hover:bg-secondary/50"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {index + 1}
          </div>
          <div>
            <p className="font-medium text-foreground">
              Participant {index + 1}
              {participant.muted && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">(muted — excluded from aggregates)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(participant.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="rounded-full">
            {accuracy}% recall
          </Badge>
          <Badge variant="outline" className="rounded-full text-destructive">
            {totalFalseAlarms} false alarm{totalFalseAlarms !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {avgTime}s avg
          </Badge>
          {onToggleMuted && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 px-2"
              title={participant.muted ? "Unmute (include in aggregates)" : "Mute (exclude from aggregates)"}
              onClick={() => onToggleMuted(participant.id, !participant.muted)}
            >
              {participant.muted ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 px-2 text-destructive hover:text-destructive"
              title="Delete this participant's data permanently"
              onClick={() => {
                if (confirm("Permanently delete this participant's data? This cannot be undone.")) {
                  onDelete(participant.id)
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results by test */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {participant.results.map((result, rIdx) => (
          <div
            key={rIdx}
            className="text-center p-2 rounded-lg bg-card"
            title={`Test ${rIdx + 1}: ${result.correctCount}/${result.totalWords} correct, ${result.rememberedWords.length - result.correctCount} false — ${NOISE_LABELS[result.noiseType]}`}
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
