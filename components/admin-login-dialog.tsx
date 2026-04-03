"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, X, LogOut, Settings } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth"

interface AdminLoginDialogProps {
  open: boolean
  onClose: () => void
  onAdminPanel: () => void
}

export function AdminLoginDialog({ open, onClose, onAdminPanel }: AdminLoginDialogProps) {
  const { isAdmin, adminEmail, login, logout } = useAdminAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    const success = await login(email, password)
    setSubmitting(false)
    if (success) {
      setEmail("")
      setPassword("")
      onClose()
    } else {
      setError("Invalid email or password")
    }
  }

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Administrator</h2>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? `Signed in as ${adminEmail}` : "Sign in to manage the experiment"}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <div className="space-y-3">
              <Button
                onClick={onAdminPanel}
                className="w-full rounded-full font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full rounded-full font-medium text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@memorylab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              <Button type="submit" disabled={submitting} className="w-full rounded-full font-medium">
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
