// SERVER-ONLY: never import this in any "use client" file.
//
// Vercel serverless instances do not share in-memory state between requests.
// To keep admin login working after deployment, we use stateless signed
// session tokens (HMAC-SHA256) stored entirely in the cookie value.

import { createHmac, timingSafeEqual } from "crypto"

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const TOKEN_VERSION = 1 as const
const DEFAULT_SESSION_SECRET = "dev-insecure-session-secret" // set ADMIN_SESSION_SECRET in production

type SessionPayload = {
  v: typeof TOKEN_VERSION
  email: string
  exp: number
}

function base64UrlEncodeUtf8(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function base64UrlDecodeToUtf8(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
  return Buffer.from(b64 + pad, "base64").toString("utf8")
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? DEFAULT_SESSION_SECRET
}

function sign(payloadBase64Url: string): string {
  const secret = getSessionSecret()
  const h = createHmac("sha256", secret).update(payloadBase64Url).digest("base64")
  return h.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8")
  const bufB = Buffer.from(b, "utf8")
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function createSession(email: string): string {
  const exp = Date.now() + SESSION_TTL_MS
  const payload: SessionPayload = { v: TOKEN_VERSION, email, exp }

  const payloadBase64Url = base64UrlEncodeUtf8(JSON.stringify(payload))
  const signature = sign(payloadBase64Url)
  return `${payloadBase64Url}.${signature}`
}

export function getSessionEmail(token: string): string | null {
  try {
    const [payloadBase64Url, signature] = token.split(".")
    if (!payloadBase64Url || !signature) return null

    const expected = sign(payloadBase64Url)
    if (!constantTimeEqual(signature, expected)) return null

    const raw = base64UrlDecodeToUtf8(payloadBase64Url)
    const parsed = JSON.parse(raw) as Partial<SessionPayload>

    if (parsed.v !== TOKEN_VERSION) return null
    if (typeof parsed.email !== "string") return null
    if (typeof parsed.exp !== "number") return null
    if (Date.now() > parsed.exp) return null

    return parsed.email
  } catch {
    return null
  }
}

export function deleteSession(_token: string): void {
  // Stateless token: logout deletes the cookie; there is nothing to revoke server-side.
}
