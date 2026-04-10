import { NextRequest, NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/admin-sessions.server"

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxBW4xqLHdIvni7RnGlyw7ICaxWJVtT8bGYhkBW5KwGOkRWvW-0uKef0iKApqLfaOji/exec"

const FETCH_TIMEOUT_MS = 55_000

function getAdminKey(): string {
  return process.env.SHEETS_ADMIN_KEY ?? ""
}

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_session")?.value
  if (!token) return false
  return !!getSessionEmail(token)
}

function splitWords(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === "string" && raw.length > 0)
    return raw.split(",").map((s: string) => s.trim()).filter(Boolean)
  return []
}

interface RawResult {
  rememberedWords: unknown
  targetWords: unknown
  [key: string]: unknown
}

interface RawParticipant {
  results: RawResult[]
  [key: string]: unknown
}

function normalizeParticipants(data: { participants?: RawParticipant[] }) {
  const list = data.participants ?? []
  return list.map((p) => ({
    ...p,
    results: p.results.map((r) => ({
      ...r,
      rememberedWords: splitWords(r.rememberedWords),
      targetWords: splitWords(r.targetWords),
    })),
  }))
}

// GET /api/participants — returns { participants: ParticipantData[] }
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = `${SHEETS_URL}?action=list&key=${encodeURIComponent(getAdminKey())}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json(
        { error: `Sheet returned ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("json")) {
      const text = await res.text().catch(() => "")
      return NextResponse.json(
        { error: `Sheet returned non-JSON (${contentType}): ${text.slice(0, 300)}` },
        { status: 502 }
      )
    }

    const data = await res.json()

    if (data.error) {
      return NextResponse.json(
        { error: `Sheet error: ${data.error}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ participants: normalizeParticipants(data) })
  } catch (e) {
    clearTimeout(timer)
    const msg = (e as Error).name === "AbortError"
      ? "Google Apps Script timed out — the sheet may have too many rows. Try again."
      : `Sheet fetch error: ${(e as Error).message}`
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

// DELETE /api/participants?id=... — hard-delete all rows for a participant
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    const res = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "delete", id, key: getAdminKey() }),
      redirect: "follow",
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Sheet delete failed: ${res.status}` },
        { status: 502 }
      )
    }
    return NextResponse.json(await res.json())
  } catch (e) {
    return NextResponse.json(
      { error: `Sheet delete error: ${(e as Error).message}` },
      { status: 502 }
    )
  }
}

// PATCH /api/participants — body: { id, muted }
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.id !== "string" || typeof body.muted !== "boolean") {
    return NextResponse.json(
      { error: "Body must be { id: string, muted: boolean }" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "mute",
        id: body.id,
        muted: body.muted,
        key: getAdminKey(),
      }),
      redirect: "follow",
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Sheet mute failed: ${res.status}` },
        { status: 502 }
      )
    }
    return NextResponse.json(await res.json())
  } catch (e) {
    return NextResponse.json(
      { error: `Sheet mute error: ${(e as Error).message}` },
      { status: 502 }
    )
  }
}
