import { NextRequest, NextResponse } from "next/server"
import { ADMIN_CREDENTIALS } from "@/lib/admin-credentials.server"
import { createSession } from "@/lib/admin-sessions.server"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const match = ADMIN_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === email?.toLowerCase() && c.password === password
  )

  if (!match) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  const token = await createSession(match.email)

  const res = NextResponse.json({ success: true, email: match.email })
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    // No maxAge = session cookie (cleared when browser tab closes)
  })
  return res
}
