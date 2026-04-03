// SERVER-ONLY: never import this in any "use client" file.
// Credentials are loaded from the ADMIN_CREDENTIALS environment variable.
// Format: "email1:password1,email2:password2,..."
// Falls back to empty list if not set.

interface AdminCredential {
  email: string
  password: string
}

function parseCredentials(): AdminCredential[] {
  const raw = process.env.ADMIN_CREDENTIALS
  if (!raw) return []
  return raw.split(",").map((entry) => {
    const [email, ...rest] = entry.split(":")
    return { email: email.trim(), password: rest.join(":").trim() }
  })
}

export const ADMIN_CREDENTIALS = parseCredentials()
