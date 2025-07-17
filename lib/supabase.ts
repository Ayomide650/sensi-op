import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://etfyfigqlverqixzgmpm.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZnlmaWdxbHZlcnFpeHpnbXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM1MTksImV4cCI6MjA2NTUwOTUxOX0.hJYwUK7S5XJ8AZk3uc23g4-pmR6ku8-923OZ8Ml4np8"

// Admin client with service role key for admin operations
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZnlmaWdxbHZlcnFpeHpnbXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkzMzUxOSwiZXhwIjoyMDY1NTA5NTE5fQ.Z27V2I5129vMUhY6ttxE7-a61NIa-BlK8wq_YoTwyhQ"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
})

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
})

export type Database = {
  public: {
    Tables: {
      user_credentials: {
        Row: {
          id: string
          user_id: string
          suspended_at: string | null
          suspension_reason: string | null
          role: "user" | "vip" | "admin"
          vip_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          suspended_at?: string | null
          suspension_reason?: string | null
          role?: "user" | "vip" | "admin"
          vip_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          role?: "user" | "vip" | "admin"
          vip_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_current_generation: {
        Row: {
          id: string
          user_id: string
          generations_today: number
          last_generation_date: string
          weekly_generations: number
          last_weekly_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          generations_today?: number
          last_generation_date?: string
          weekly_generations?: number
          last_weekly_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          generations_today?: number
          last_generation_date?: string
          weekly_generations?: number
          last_weekly_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      redeem_codes: {
        Row: {
          id: string
          code: string
          max_uses: number
          current_uses: number
          duration_days: number
          created_at: string
          expires_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          code: string
          max_uses?: number
          current_uses?: number
          duration_days?: number
          created_at?: string
          expires_at: string
          is_active?: boolean
        }
        Update: {
          id?: string
          code?: string
          max_uses?: number
          current_uses?: number
          duration_days?: number
          created_at?: string
          expires_at?: string
          is_active?: boolean
        }
      }
      group_chat_messages: {
        Row: {
          id: string
          user_id: string
          username: string
          message: string
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          message: string
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          message?: string
          is_deleted?: boolean
          created_at?: string
        }
      }
      changelogs: {
        Row: {
          id: string
          version: string
          title: string
          description: string
          changes: string[]
          created_at: string
          is_published: boolean
        }
        Insert: {
          id?: string
          version: string
          title: string
          description: string
          changes: string[]
          created_at?: string
          is_published?: boolean
        }
        Update: {
          id?: string
          version?: string
          title?: string
          description?: string
          changes?: string[]
          created_at?: string
          is_published?: boolean
        }
      }
    }
  }
}
