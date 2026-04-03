import { NextRequest, NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/admin-sessions.server"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value
  if (!token) return NextResponse.json({ isAdmin: false, email: null })

  const email = await getSessionEmail(token)
  if (!email) return NextResponse.json({ isAdmin: false, email: null })

  return NextResponse.json({ isAdmin: true, email })
}
