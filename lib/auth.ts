import { supabase } from "./supabase"

export interface AuthUser {
  id: string
  username: string
  role: "user" | "vip" | "admin"
  vipExpiresAt?: string
  suspendedAt?: string
  suspensionReason?: string
}

// Fallback local storage for demo when Supabase is unavailable
const LOCAL_USERS_KEY = "sensi-gen-local-users"
const ADMIN_KEY = "ahmed@ibmk" // Keep this private in code

const getLocalUsers = (): any[] => {
  if (typeof window === "undefined") return []
  try {
    const users = localStorage.getItem(LOCAL_USERS_KEY)
    return users ? JSON.parse(users) : []
  } catch {
    return []
  }
}

const saveLocalUsers = (users: any[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  } catch (error) {
    console.error("Failed to save users:", error)
  }
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const authService = {
  async signIn(username: string, password: string): Promise<AuthUser> {
    try {
      // Try Supabase first
      const { data: users, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .limit(1)

      if (!fetchError && users && users.length > 0) {
        const user = users[0]

        if (user.suspended_at) {
          throw new Error(`Account suspended: ${user.suspension_reason || "No reason provided"}`)
        }

        const isValidPassword = await this.verifyPassword(password, user.password_hash)
        if (!isValidPassword) {
          throw new Error("Invalid username or password")
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          vipExpiresAt: user.vip_expires_at,
          suspendedAt: user.suspended_at,
          suspensionReason: user.suspension_reason,
        }
      }
    } catch (error) {
      console.log("Supabase unavailable, using local storage fallback")
    }

    // Fallback to local storage
    const localUsers = getLocalUsers()
    const user = localUsers.find((u) => u.username === username)

    if (!user) {
      throw new Error("Invalid username or password")
    }

    if (user.suspended_at) {
      throw new Error(`Account suspended: ${user.suspension_reason || "No reason provided"}`)
    }

    const isValidPassword = await this.verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error("Invalid username or password")
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      vipExpiresAt: user.vip_expires_at,
      suspendedAt: user.suspended_at,
      suspensionReason: user.suspension_reason,
    }
  },

  async signUp(username: string, password: string): Promise<AuthUser> {
    try {
      // Try Supabase first
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .limit(1)

      if (!checkError) {
        if (existingUsers && existingUsers.length > 0) {
          throw new Error("Username already exists")
        }

        const passwordHash = await this.hashPassword(password)
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            username,
            password_hash: passwordHash,
            role: "user",
          })
          .select()
          .single()

        if (!insertError && newUser) {
          await supabase.from("user_current_generation").insert({
            user_id: newUser.id,
          })

          return {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            vipExpiresAt: newUser.vip_expires_at,
            suspendedAt: newUser.suspended_at,
            suspensionReason: newUser.suspension_reason,
          }
        }
      }
    } catch (error) {
      console.log("Supabase unavailable, using local storage fallback")
    }

    // Fallback to local storage
    const localUsers = getLocalUsers()

    if (localUsers.find((u) => u.username === username)) {
      throw new Error("Username already exists")
    }

    const passwordHash = await this.hashPassword(password)
    const newUser = {
      id: generateId(),
      username,
      password_hash: passwordHash,
      role: "user",
      vip_expires_at: null,
      suspended_at: null,
      suspension_reason: null,
      created_at: new Date().toISOString(),
    }

    localUsers.push(newUser)
    saveLocalUsers(localUsers)

    return {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      vipExpiresAt: newUser.vip_expires_at,
      suspendedAt: newUser.suspended_at,
      suspensionReason: newUser.suspension_reason,
    }
  },

  async adminSignIn(adminKey: string): Promise<AuthUser> {
    // Check admin key
    if (adminKey !== ADMIN_KEY) {
      throw new Error("Invalid admin key")
    }

    try {
      // Try Supabase first
      const { data: adminUser, error: adminError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "admin")
        .limit(1)
        .single()

      if (!adminError && adminUser) {
        return {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          vipExpiresAt: adminUser.vip_expires_at,
          suspendedAt: adminUser.suspended_at,
          suspensionReason: adminUser.suspension_reason,
        }
      }

      if (adminError && adminError.code === "PGRST116") {
        // Create admin user if doesn't exist
        const { data: newAdmin, error: createError } = await supabase
          .from("users")
          .insert({
            username: "admin",
            password_hash: await this.hashPassword("admin"),
            role: "admin",
          })
          .select()
          .single()

        if (!createError && newAdmin) {
          await supabase.from("user_current_generation").insert({
            user_id: newAdmin.id,
          })

          return {
            id: newAdmin.id,
            username: newAdmin.username,
            role: newAdmin.role,
            vipExpiresAt: newAdmin.vip_expires_at,
            suspendedAt: newAdmin.suspended_at,
            suspensionReason: newAdmin.suspension_reason,
          }
        }
      }
    } catch (error) {
      console.log("Supabase unavailable, using local storage fallback")
    }

    // Fallback to local storage
    const localUsers = getLocalUsers()
    let adminUser = localUsers.find((u) => u.role === "admin")

    if (!adminUser) {
      // Create admin user
      adminUser = {
        id: generateId(),
        username: "admin",
        password_hash: await this.hashPassword("admin"),
        role: "admin",
        vip_expires_at: null,
        suspended_at: null,
        suspension_reason: null,
        created_at: new Date().toISOString(),
      }
      localUsers.push(adminUser)
      saveLocalUsers(localUsers)
    }

    return {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      vipExpiresAt: adminUser.vip_expires_at,
      suspendedAt: adminUser.suspended_at,
      suspensionReason: adminUser.suspension_reason,
    }
  },

  async signOut(): Promise<void> {
    return Promise.resolve()
  },

  // Simple password hashing (for demo - use bcrypt in production)
  async hashPassword(password: string): Promise<string> {
    return btoa(password + "salt_sensi_gen_2024")
  },

  // Simple password verification (for demo - use bcrypt in production)
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const expectedHash = await this.hashPassword(password)
      return expectedHash === hash
    } catch {
      return false
    }
  },
}
