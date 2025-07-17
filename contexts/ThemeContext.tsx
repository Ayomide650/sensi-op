"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("theme")
    setIsDark(saved === "dark")
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", isDark ? "dark" : "light")
      if (isDark) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [isDark, mounted])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div>{children}</div>
  }

  return <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>
}
