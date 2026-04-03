import { NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/admin-sessions.server"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value
  if (token) deleteSession(token)

  const res = NextResponse.json({ success: true })
  res.cookies.delete("admin_session")
  return res
}
