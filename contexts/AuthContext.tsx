"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { onlineChecker } from "../utils/onlineChecker"
import type { User } from "../types"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isOnline: boolean
  signIn: (username: string, password: string) => Promise<boolean>
  signUp: (username: string, password: string) => Promise<boolean>
  adminSignIn: (adminKey: string) => Promise<boolean>
  signOut: () => void
  redeemVipCode: (code: string) => Promise<boolean>
  canGenerate: () => boolean
  incrementGeneration: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(onlineChecker.getStatus())

  // Monitor online status
  useEffect(() => {
    const handleOnlineChange = (online: boolean) => {
      setIsOnline(online)
      if (!online) {
        setError("You are offline. Please check your internet connection.")
      } else {
        setError(null)
      }
    }

    onlineChecker.addListener(handleOnlineChange)
    return () => onlineChecker.removeListener(handleOnlineChange)
  }, [])

  // Everyone can generate unlimited times now - no restrictions
  const canGenerate = useCallback((): boolean => {
    return isOnline // Only requirement is being online
  }, [isOnline])

  // No need to track generations anymore since everyone has unlimited
  const incrementGeneration = useCallback(async (): Promise<void> => {
    if (!user || !isOnline) {
      throw new Error("Cannot generate sensitivity while offline")
    }
    // No database updates needed since we removed generation limits
    return Promise.resolve()
  }, [user, isOnline])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isOnline) {
          setLoading(false)
          return
        }

        // Check for existing session (minimal info only)
        const savedSession = typeof window !== "undefined" ? localStorage.getItem("ff_user_session") : null

        if (savedSession) {
          const sessionData = JSON.parse(savedSession)

          // Fetch fresh user data from Supabase
          const { data, error } = await supabase
            .from("user_credentials")
            .select("*")
            .eq("user_id", sessionData.id)
            .single()

          if (data && !error) {
            const userData: User = {
              id: data.user_id,
              username: data.username,
              role: data.role || "user",
              generationsToday: 0, // Not tracking anymore
              lastGenerationDate: "",
              createdAt: data.created_at,
            }
            setUser(userData)
          } else {
            // Invalid session, clear it
            if (typeof window !== "undefined") {
              localStorage.removeItem("ff_user_session")
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err)
        setError("Failed to initialize authentication")
        if (typeof window !== "undefined") {
          localStorage.removeItem("ff_user_session")
        }
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [isOnline])

  const signIn = async (username: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await onlineChecker.requireOnline()

      // Try new users table first
      let { data, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password_hash", password) // Note: In production, use proper password hashing!
        .single()

      // If not found in users table, try user_credentials table
      if (supabaseError) {
        const result = await supabase
          .from("user_credentials")
          .select("*")
          .eq("username", username)
          .eq("password", password)
          .single()

        data = result.data
        supabaseError = result.error
      }

      if (data && !supabaseError) {
        const userData: User = {
          id: data.id || data.user_id,
          username: data.username,
          role: data.role || "user",
          generationsToday: 0, // Not tracking anymore
          lastGenerationDate: "",
          createdAt: data.created_at,
        }

        setUser(userData)

        // Store minimal session info
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "ff_user_session",
            JSON.stringify({
              id: userData.id,
              username: userData.username,
              role: userData.role,
            }),
          )
        }
        return true
      }

      setError("Invalid username or password")
      return false
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Login failed. Please check your internet connection.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (username: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await onlineChecker.requireOnline()

      const userId = crypto.randomUUID()
      const now = new Date().toISOString()

      const newUser = {
        user_id: userId,
        username,
        password,
        role: "user" as const,
        generations_today: 0,
        last_generation_date: "",
        created_at: now,
        updated_at: now,
      }

      // Try inserting into the users table first (new structure)
      let { data, error: supabaseError } = await supabase
        .from("users")
        .insert([
          {
            id: userId,
            username,
            password_hash: password, // Note: In production, hash this password!
            role: "user",
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single()

      // If users table doesn't exist, try user_credentials table (old structure)
      if (supabaseError) {
        const result = await supabase.from("user_credentials").insert([newUser]).select().single()
        data = result.data
        supabaseError = result.error
      }

      if (data && !supabaseError) {
        const userData: User = {
          id: data.user_id,
          username: data.username,
          role: data.role,
          generationsToday: 0, // Not tracking anymore
          lastGenerationDate: "",
          createdAt: data.created_at,
        }

        setUser(userData)

        // Store minimal session info
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "ff_user_session",
            JSON.stringify({
              id: userData.id,
              username: userData.username,
              role: userData.role,
            }),
          )
        }
        return true
      }

      if (supabaseError?.code === "23505") {
        setError("Username already exists")
      } else {
        setError("Signup failed. Please try again.")
      }
      return false
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(err.message || "Signup failed. Please check your internet connection.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const adminSignIn = async (adminKey: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await onlineChecker.requireOnline()

      // Check against your specific admin key in Supabase
      const { data, error } = await supabase
        .from("admin_keys")
        .select("*")
        .eq("key_value", adminKey)
        .eq("is_active", true)
        .single()

      if (data && !error) {
        // Create admin user with proper UUID
        const adminUser: User = {
          id: crypto.randomUUID(), // Use proper UUID instead of "admin-ahmed"
          username: "Ahmed (Admin)",
          role: "admin",
          generationsToday: 0,
          lastGenerationDate: "",
          createdAt: new Date().toISOString(),
        }

        setUser(adminUser)

        // Store minimal session info
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "ff_user_session",
            JSON.stringify({
              id: adminUser.id,
              username: adminUser.username,
              role: adminUser.role,
            }),
          )
        }

        return true
      }

      // Fallback check for your specific key
      if (adminKey === "ahmed@ibmk") {
        const adminUser: User = {
          id: "admin-ahmed",
          username: "Ahmed (Admin)",
          role: "admin",
          generationsToday: 0,
          lastGenerationDate: "",
          createdAt: new Date().toISOString(),
        }

        setUser(adminUser)

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "ff_user_session",
            JSON.stringify({
              id: adminUser.id,
              username: adminUser.username,
              role: adminUser.role,
            }),
          )
        }

        return true
      }

      setError("Invalid admin key")
      return false
    } catch (err: any) {
      console.error("Admin login error:", err)
      setError(err.message || "Admin login failed. Please check your internet connection.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("ff_user_session")
    }
  }

  const redeemVipCode = async (code: string): Promise<boolean> => {
    if (!user || !isOnline) return false

    try {
      await onlineChecker.requireOnline()

      const { data: codeData, error: fetchError } = await supabase
        .from("redeem_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single()

      if (codeData && !fetchError) {
        // Check if code has uses left
        if (codeData.current_uses >= codeData.max_uses) {
          return false
        }

        // Check if code is expired
        if (new Date(codeData.expires_at) < new Date()) {
          return false
        }

        // Update code usage
        const { error: updateError } = await supabase
          .from("redeem_codes")
          .update({
            current_uses: codeData.current_uses + 1,
          })
          .eq("code", code)

        if (!updateError) {
          // Update user role
          const vipExpiresAt = new Date()
          vipExpiresAt.setDate(vipExpiresAt.getDate() + codeData.duration_days)

          const { error: userUpdateError } = await supabase
            .from("user_credentials")
            .update({
              role: "vip",
              vip_expires_at: vipExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)

          if (!userUpdateError) {
            const updatedUser = { ...user, role: "vip" as const }
            setUser(updatedUser)

            // Update session
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "ff_user_session",
                JSON.stringify({
                  id: updatedUser.id,
                  username: updatedUser.username,
                  role: updatedUser.role,
                }),
              )
            }
            return true
          }
        }
      }

      return false
    } catch (err: any) {
      console.error("Redeem code error:", err)
      throw new Error(err.message || "Failed to redeem code. Please check your internet connection.")
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isOnline,
    signIn,
    signUp,
    adminSignIn,
    signOut,
    redeemVipCode,
    canGenerate,
    incrementGeneration,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
