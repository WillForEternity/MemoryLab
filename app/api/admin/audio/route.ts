import { NextRequest, NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/admin-sessions.server"
import { put, del, list } from "@vercel/blob"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_NOISE_TYPES = /^[a-zA-Z0-9_-]+$/
const ALLOWED_EXTENSIONS = new Set(["mp3", "m4a", "aac", "ogg", "wav", "webm", "flac", "aiff"])
const BLOB_PREFIX = "custom-audio/"

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_session")?.value
  if (!token) return false
  return !!getSessionEmail(token)
}

// GET /api/admin/audio — returns { cafe: "https://…blob-url…", ... }
export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX })
    const meta: Record<string, string> = {}
    for (const blob of blobs) {
      // pathname is "custom-audio/cafe.mp3" → noiseType is "cafe"
      const filename = blob.pathname.replace(BLOB_PREFIX, "")
      const noiseType = filename.replace(/\.[^.]+$/, "")
      meta[noiseType] = blob.url
    }
    return NextResponse.json(meta)
  } catch {
    return NextResponse.json({})
  }
}

// POST /api/admin/audio — multipart form: noiseType + file
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const noiseType = form.get("noiseType")
  const file = form.get("file")

  if (typeof noiseType !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing noiseType or file" }, { status: 400 })
  }

  if (!ALLOWED_NOISE_TYPES.test(noiseType)) {
    return NextResponse.json({ error: "Invalid noiseType — alphanumeric, hyphens, underscores only" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)` }, { status: 400 })
  }

  // Derive extension
  let ext = "mp3"
  if (file instanceof File && file.name) {
    const parts = file.name.split(".")
    if (parts.length > 1) ext = parts[parts.length - 1].toLowerCase()
  } else {
    const mimeMap: Record<string, string> = {
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "aac",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
      "audio/webm": "webm",
      "audio/flac": "flac",
      "audio/x-aiff": "aiff",
    }
    ext = mimeMap[file.type] ?? "mp3"
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `Unsupported audio format: .${ext}` }, { status: 400 })
  }

  // Delete any existing blob for this noise type before uploading the new one
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${noiseType}.` })
    for (const blob of blobs) {
      await del(blob.url)
    }
  } catch {
    // If listing fails, continue with the upload
  }

  const pathname = `${BLOB_PREFIX}${noiseType}.${ext}`
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
  })

  return NextResponse.json({ url: blob.url })
}

// DELETE /api/admin/audio?noiseType=cafe
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const noiseType = req.nextUrl.searchParams.get("noiseType")
  if (!noiseType) return NextResponse.json({ error: "Missing noiseType" }, { status: 400 })
  if (!ALLOWED_NOISE_TYPES.test(noiseType)) {
    return NextResponse.json({ error: "Invalid noiseType" }, { status: 400 })
  }

  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${noiseType}.` })
    for (const blob of blobs) {
      await del(blob.url)
    }
  } catch {
    // Ignore deletion errors
  }

  return NextResponse.json({ success: true })
}
