export type NoiseType = "silence" | "white-noise" | "cafe" | "music"

export interface VideoTest {
  id: number
  title: string
  noiseType: NoiseType
  words: string[]
  audioUrl: string
}

export interface TestResult {
  testId: number
  rememberedWords: string[]
  targetWords: string[] // the actual words shown in this test (randomized per session)
  timeTakenMs: number
  noiseType: NoiseType
  correctCount: number
  totalWords: number
  presentationOrder: number // 0-indexed position this test was shown in (for position-effect analysis)
}

// Fisher-Yates shuffle — returns a new array in random order.
export function shuffle<T>(array: T[]): T[] {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface ParticipantData {
  id: string
  timestamp: Date
  results: TestResult[]
  completed: boolean
  muted?: boolean
}

export const NOISE_LABELS: Record<NoiseType, string> = {
  silence: "Silence",
  "white-noise": "White Noise",
  cafe: "Cafe Ambience",
  music: "Music (Kids – MGMT)",
}

export const NOISE_COLORS: Record<NoiseType, string> = {
  silence: "var(--chart-1)",
  "white-noise": "var(--chart-2)",
  cafe: "var(--chart-3)",
  music: "var(--chart-5)",
}

// Ambient audio files, shipped as static assets in /public and served by the
// Vercel CDN. Silence has no file. Keep these paths stable — the player loads
// them directly with `new Audio(url)`.
export const NOISE_AUDIO_URLS: Record<NoiseType, string> = {
  silence: "",
  "white-noise": "/white-noise.mp3",
  cafe: "/cafe-ambience.mp3",
  music: "/mgmt-kids-chorus.mp3",
}

// 10-word lists drawn from Roediger & McDermott (1995) DRM paradigm.
// Pool of 16 lists — 8 are randomly selected and assigned to tests each session.
export const WORD_LISTS: string[][] = [
  ["white", "dark", "cat", "charred", "night", "funeral", "color", "grief", "blue", "death"],           // Black
  ["hot", "snow", "warm", "winter", "ice", "wet", "frigid", "chilly", "heat", "weather"],               // Cold
  ["nurse", "sick", "lawyer", "medicine", "health", "hospital", "dentist", "physician", "ill", "patient"], // Doctor
  ["apple", "vegetable", "orange", "kiwi", "citrus", "ripe", "pear", "banana", "berry", "cherry"],      // Fruit
  ["hill", "valley", "climb", "summit", "top", "molehill", "peak", "plain", "glacier", "goat"],         // Mountain
  ["water", "stream", "lake", "Mississippi", "boat", "tide", "swim", "flow", "barge", "run"],           // River
  ["bed", "rest", "awake", "tired", "dream", "wake", "snooze", "blanket", "doze", "slumber"],           // Sleep
  ["note", "sound", "piano", "sing", "radio", "band", "melody", "horn", "concert", "instrument"],       // Music
  ["mad", "fear", "hate", "rage", "temper", "fury", "ire", "wrath", "happy", "fight"],                  // Anger
  ["butter", "food", "eat", "sandwich", "rye", "jam", "milk", "flour", "jelly", "dough"],               // Bread
  ["table", "sit", "legs", "seat", "couch", "desk", "recliner", "sofa", "wood", "cushion"],             // Chair
  ["shoe", "hand", "toe", "kick", "sandals", "soccer", "yard", "walk", "ankle", "arm"],                 // Foot
  ["boy", "dolls", "female", "young", "dress", "pretty", "hair", "niece", "dance", "beautiful"],        // Girl
  ["low", "clouds", "up", "tall", "tower", "jump", "above", "building", "noon", "cliff"],               // High
  ["smooth", "bumpy", "road", "tough", "sandpaper", "jagged", "ready", "coarse", "uneven", "riders"],   // Rough
  ["sour", "candy", "sugar", "bitter", "good", "taste", "tooth", "nice", "honey", "soda"],              // Sweet
]

// 8 tests: 2 per noise type (silence, white-noise, cafe, music).
// Word lists are assigned randomly per session via buildSessionTests().
const TEST_NOISE_TYPES: NoiseType[] = [
  "silence", "white-noise", "cafe", "music",
  "silence", "white-noise", "cafe", "music",
]

export function buildSessionTests(): VideoTest[] {
  const selectedLists = shuffle(WORD_LISTS).slice(0, 8)
  const noiseOrder = shuffle(TEST_NOISE_TYPES)
  return noiseOrder.map((noiseType, i) => ({
    id: i + 1,
    title: `Video ${i + 1}`,
    noiseType,
    words: shuffle(selectedLists[i]),
    audioUrl: NOISE_AUDIO_URLS[noiseType],
  }))
}

// Default static set (used for type references and Google Sheets target-word lookup)
export const TEST_VIDEOS: VideoTest[] = buildSessionTests()
