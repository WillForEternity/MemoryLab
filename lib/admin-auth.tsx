"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface AdminAuthContextType {
  isAdmin: boolean
  adminEmail: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  adminEmail: null,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
})

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: verify session with server
  useEffect(() => {
    fetch("/api/admin/verify")
      .then((r) => r.json())
      .then((session) => {
        if (session.isAdmin) setAdminEmail(session.email)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      const data = await res.json()
      setAdminEmail(data.email)
      return true
    }
    return false
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    setAdminEmail(null)
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin: !!adminEmail,
        adminEmail,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
