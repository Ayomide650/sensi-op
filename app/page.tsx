"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { ThemeProvider } from "../contexts/ThemeContext"
import Header from "../components/Header"
import AuthPage from "../components/AuthPage"
import UserDashboard from "../components/UserDashboard"
import AdminDashboard from "../components/AdminDashboard"

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Handle ServiceWorker errors gracefully
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        if (event.message?.includes("ServiceWorker") || event.message?.includes("__v0_sw.js")) {
          // Suppress ServiceWorker errors in v0 preview
          event.preventDefault()
          console.warn("ServiceWorker error suppressed (v0 preview environment)")
        }
      })
    }
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="py-6">{user.role === "admin" ? <AdminDashboard /> : <UserDashboard />}</main>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
