// Admin-only proxy to the Google Sheet (via Apps Script).
// The sheet is the single source of truth for all participant data.
// The admin key stays server-side; it's never exposed to the browser.

import { NextRequest, NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/admin-sessions.server"

const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwBUYNJgIXe-TCejK-sFZ4Ua6Sj-mvUr9I6Fpto3TWOK9f_TmBWam_Vaq07IFtNE14/exec"

function getAdminKey(): string {
  return process.env.SHEETS_ADMIN_KEY ?? ""
}

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_session")?.value
  if (!token) return false
  return !!getSessionEmail(token)
}

// GET /api/participants — returns { participants: ParticipantData[] }
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = `${SHEETS_URL}?action=list&key=${encodeURIComponent(getAdminKey())}`
  try {
    const res = await fetch(url, { cache: "no-store", redirect: "follow" })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Sheet fetch failed: ${res.status}` },
        { status: 502 }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: `Sheet fetch error: ${(e as Error).message}` },
      { status: 502 }
    )
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
