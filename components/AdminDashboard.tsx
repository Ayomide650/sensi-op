"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Shield,
  Users,
  Crown,
  Settings,
  BarChart3,
  Key,
  Eye,
  EyeOff,
  MessageSquare,
  Star,
  UserX,
  UserCheck,
  Ban,
  CheckCircle,
  WifiOff,
  ListChecks,
  User,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"
import DeviceSelectionForm from "./DeviceSelectionForm"
import ResultsPanel from "./ResultsPanel"
import WorldChat from "./WorldChat"
import LoadingBar from "./LoadingBar"
import ReviewModal from "./ReviewModal"
import Changelog from "./Changelog"
import { calculateSensitivity } from "../utils/sensitivityCalculator" // Use VIP calculator for admin
import type { DeviceInfo } from "../types"

// Generate a simple UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface UserData {
  user_id: string
  username: string
  created_at: string
  is_suspended?: boolean
  suspended_at?: string
  suspension_reason?: string
  role?: string
}

interface ReviewData {
  id: string
  user_id: string
  username: string
  device_name: string
  rating: number
  comment: string
  created_at: string
  status: string
  helpful_count: number
  reported_count: number
}

type ActiveTab = "overview" | "users" | "reviews" | "sensitivity" | "chat" | "redeem-codes" | "settings" | "changelog"

const AdminDashboard: React.FC = () => {
  const { user, signOut, isOnline } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [vipPassword, setVipPassword] = useState("VIPAHMED")
  const [adminPassword, setAdminPassword] = useState("ahmed@ibmk")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [suspendingUsers, setSuspendingUsers] = useState<Set<string>>(new Set())
  const [redeemCodes, setRedeemCodes] = useState<any[]>([])
  const [newCode, setNewCode] = useState({
    code: "",
    maxUses: 1,
    durationDays: 30,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingGeneration, setPendingGeneration] = useState<{
    device: DeviceInfo
    playStyle: string
    experienceLevel: string
  } | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null)
  const [playStyleState, setPlayStyleState] = useState("")
  const [sensitivityResult, setSensitivityResult] = useState<ReturnType<typeof calculateSensitivity> | null>(null)
  const [isLoadingState, setIsLoadingState] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewingDeviceName, setReviewingDeviceName] = useState("")

  useEffect(() => {
    if (user?.role === "admin" && isOnline) {
      fetchData()
      fetchRedeemCodes()
      // Load current passwords from localStorage if they exist
      const savedVipPassword = localStorage.getItem("vip_password")
      const savedAdminPassword = localStorage.getItem("admin_password")

      if (savedVipPassword) setVipPassword(savedVipPassword)
      if (savedAdminPassword) setAdminPassword(savedAdminPassword)
    }
  }, [user, isOnline])

  const fetchData = async () => {
    if (!isOnline) {
      setLoading(false)
      return
    }

    try {
      // Fetch users from the users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, created_at, suspended_at, suspension_reason, role")
        .order("created_at", { ascending: false })

      if (!usersError && usersData) {
        const formattedUsers = usersData.map((user) => ({
          user_id: user.id,
          username: user.username,
          created_at: user.created_at,
          is_suspended: !!user.suspended_at,
          suspended_at: user.suspended_at,
          suspension_reason: user.suspension_reason,
          role: user.role,
        }))

        setUsers(formattedUsers)
        setTotalUsers(formattedUsers.length)
      } else {
        // Try user_credentials table as fallback
        const { data: credentialsData, error: credentialsError } = await supabase
          .from("user_credentials")
          .select("user_id, username, created_at, suspended_at, suspension_reason, role")
          .order("created_at", { ascending: false })

        if (!credentialsError && credentialsData) {
          const formattedUsers = credentialsData.map((user) => ({
            user_id: user.user_id,
            username: user.username,
            created_at: user.created_at,
            is_suspended: !!user.suspended_at,
            suspended_at: user.suspended_at,
            suspension_reason: user.suspension_reason,
            role: user.role,
          }))

          setUsers(formattedUsers)
          setTotalUsers(formattedUsers.length)
        }
      }

      // Fetch reviews (if reviews table exists)
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .not("comment", "is", null)
          .neq("comment", "")
          .order("created_at", { ascending: false })

        if (!reviewsError && reviewsData) {
          setReviews(reviewsData)
          setTotalReviews(reviewsData.length)
        }
      } catch (reviewError) {
        console.log("Reviews table not available")
        setReviews([])
        setTotalReviews(0)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setUsers([])
      setReviews([])
      setTotalUsers(0)
      setTotalReviews(0)
    }
    setLoading(false)
  }

  const handleSuspendUser = async (userId: string, username: string) => {
    if (!user?.id || !isOnline) return

    const reason = prompt(`Enter reason for suspending ${username}:`)
    if (!reason) return

    setSuspendingUsers((prev) => new Set(prev).add(userId))

    try {
      const { error } = await supabase
        .from("users")
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        // Try user_credentials table as fallback
        const { error: credentialsError } = await supabase
          .from("user_credentials")
          .update({
            suspended_at: new Date().toISOString(),
            suspension_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        if (credentialsError) {
          console.error("Error suspending user:", credentialsError)
          alert("Failed to suspend user. Please try again.")
        } else {
          alert(`User ${username} has been suspended successfully.`)
          fetchData() // Refresh data
        }
      } else {
        alert(`User ${username} has been suspended successfully.`)
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error suspending user:", error)
      alert("Failed to suspend user. Please try again.")
    }

    setSuspendingUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const handleUnsuspendUser = async (userId: string, username: string) => {
    if (!user?.id || !isOnline) return

    if (!confirm(`Are you sure you want to unsuspend ${username}?`)) return

    setSuspendingUsers((prev) => new Set(prev).add(userId))

    try {
      const { error } = await supabase
        .from("users")
        .update({
          suspended_at: null,
          suspension_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        // Try user_credentials table as fallback
        const { error: credentialsError } = await supabase
          .from("user_credentials")
          .update({
            suspended_at: null,
            suspension_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        if (credentialsError) {
          console.error("Error unsuspending user:", credentialsError)
          alert("Failed to unsuspend user. Please try again.")
        } else {
          alert(`User ${username} has been unsuspended successfully.`)
          fetchData() // Refresh data
        }
      } else {
        alert(`User ${username} has been unsuspended successfully.`)
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error unsuspending user:", error)
      alert("Failed to unsuspend user. Please try again.")
    }

    setSuspendingUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const handlePasswordUpdate = async () => {
    setUpdateLoading(true)
    setUpdateMessage("")

    try {
      // Save passwords to localStorage (you can also save to your database)
      localStorage.setItem("vip_password", vipPassword)
      localStorage.setItem("admin_password", adminPassword)

      // Optional: Update passwords in your database/backend
      // You can add your database update logic here

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUpdateMessage("Passwords updated successfully!")
      setTimeout(() => setUpdateMessage(""), 3000)
    } catch (error) {
      console.error("Error updating passwords:", error)
      setUpdateMessage("Failed to update passwords. Please try again.")
      setTimeout(() => setUpdateMessage(""), 3000)
    } finally {
      setUpdateLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-500 fill-current" : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    )
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      signOut()
    }
  }

  const fetchRedeemCodes = async () => {
    if (!isOnline) return

    try {
      const { data, error } = await supabase.from("redeem_codes").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching redeem codes:", error)
        setRedeemCodes([])
      } else {
        setRedeemCodes(data || [])
      }
    } catch (error) {
      console.error("Error fetching redeem codes:", error)
      setRedeemCodes([])
    }
  }

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode({ ...newCode, code: result })
  }

  const createRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.code.trim() || !isOnline) return

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + newCode.durationDays)

      const codeData = {
        code: newCode.code.toUpperCase(),
        max_uses: newCode.maxUses,
        current_uses: 0,
        duration_days: newCode.durationDays,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      }

      const { data, error } = await supabase.from("redeem_codes").insert(codeData).select()

      if (error) {
        console.error("Error creating redeem code:", error)
        alert("Failed to create redeem code. Please try again.")
      } else {
        alert("Redeem code created successfully!")
        fetchRedeemCodes() // Refresh the list
        setNewCode({ code: "", maxUses: 1, durationDays: 30 })
      }
    } catch (error) {
      console.error("Error creating redeem code:", error)
      alert("Failed to create redeem code. Please try again.")
    }
  }

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    if (!isOnline) return

    try {
      const { error } = await supabase.from("redeem_codes").update({ is_active: !currentStatus }).eq("id", codeId)

      if (error) {
        console.error("Error updating code status:", error)
        alert("Failed to update code status. Please try again.")
      } else {
        fetchRedeemCodes()
      }
    } catch (error) {
      console.error("Error updating code status:", error)
      alert("Failed to update code status. Please try again.")
    }
  }

  const handleGenerate = useCallback(async (device: DeviceInfo, style: string, experienceLevel: string) => {
    setIsLoadingState(true)
    setErrorState(null)
    setSensitivityResult(null)
    setSelectedDevice(device)
    setPlayStyleState(style)
    setReviewingDeviceName(device.name)
    setIsGenerating(true)

    try {
      // Simulate loading time for the loading bar
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Admin uses VIP calculator (advanced calculator)
      const result = calculateSensitivity(device, style, experienceLevel)
      setSensitivityResult(result)
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsLoadingState(false)
      setIsGenerating(false)
    }
  }, [])

  const handleOpenReviewModal = useCallback(() => {
    if (selectedDevice) {
      setReviewingDeviceName(selectedDevice.name)
      setIsReviewModalOpen(true)
    } else {
      setErrorState("Please generate sensitivity for a device first.")
    }
  }, [selectedDevice])

  const handleCloseReviewModal = useCallback(() => {
    setIsReviewModalOpen(false)
    setReviewingDeviceName("")
  }, [])

  const handleLoadingComplete = () => {
    setIsGenerating(false)
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">You're Offline</h2>
            <p className="text-gray-600 dark:text-gray-400">Admin dashboard requires an internet connection.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Bar */}
        <LoadingBar isVisible={isGenerating} onComplete={handleLoadingComplete} />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage users and system settings</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    Admin - Advanced Calculator & Unlimited Access
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "overview", label: "Overview", icon: BarChart3 },
                  { key: "users", label: "Users", icon: Users },
                  { key: "reviews", label: "Reviews", icon: MessageSquare },
                  { key: "sensitivity", label: "Sensitivity Gen", icon: Settings },
                  { key: "chat", label: "World Chat", icon: MessageSquare },
                  { key: "redeem-codes", label: "Redeem Codes", icon: Key },
                  { key: "changelog", label: "Changelog", icon: ListChecks },
                  { key: "settings", label: "Settings", icon: Settings },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as ActiveTab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === key
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? "..." : totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">VIP Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {users.filter((u) => u.role === "vip").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reviews with Comments</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? "..." : totalReviews}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Suspended Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {users.filter((u) => u.is_suspended).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{user.username}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.role === "vip" && <Crown className="w-4 h-4 text-yellow-500" />}
                        {user.role === "admin" && <Shield className="w-4 h-4 text-purple-500" />}
                        {user.is_suspended && <Ban className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Reviews</h3>
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800 dark:text-white">{review.username}</span>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{review.device_name}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">User Management</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Username</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userData) => (
                      <tr key={userData.user_id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {userData.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800 dark:text-white">{userData.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {userData.role === "admin" && (
                              <>
                                <Shield className="w-4 h-4 text-purple-500" />
                                <span className="text-purple-600 dark:text-purple-400 font-medium">Admin</span>
                              </>
                            )}
                            {userData.role === "vip" && (
                              <>
                                <Crown className="w-4 h-4 text-yellow-500" />
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">VIP</span>
                              </>
                            )}
                            {(!userData.role || userData.role === "user") && (
                              <span className="text-gray-600 dark:text-gray-400">User</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {userData.is_suspended ? (
                            <div className="flex items-center space-x-2">
                              <Ban className="w-4 h-4 text-red-500" />
                              <span className="text-red-600 dark:text-red-400 font-medium">Suspended</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {userData.is_suspended ? (
                              <button
                                onClick={() => handleUnsuspendUser(userData.user_id, userData.username)}
                                disabled={suspendingUsers.has(userData.user_id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span className="text-sm">
                                  {suspendingUsers.has(userData.user_id) ? "..." : "Unsuspend"}
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendUser(userData.user_id, userData.username)}
                                disabled={suspendingUsers.has(userData.user_id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                              >
                                <UserX className="w-4 h-4" />
                                <span className="text-sm">
                                  {suspendingUsers.has(userData.user_id) ? "..." : "Suspend"}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Review Management</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading reviews...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {review.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{review.username}</p>
                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{review.device_name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-green-600 dark:text-green-400">
                            👍 {review.helpful_count || 0}
                          </span>
                          <span className="text-sm text-red-600 dark:text-red-400">
                            🚩 {review.reported_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.status === "approved"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : review.status === "rejected"
                              ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                              : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                        }`}
                      >
                        {review.status || "pending"}
                      </span>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No reviews with comments found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "sensitivity" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Device Selection Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Admin Sensitivity Generator</h2>
              </div>
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Advanced Calculator</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Using VIP calculator with advanced optimization and all playstyles unlocked.
                    </p>
                  </div>
                </div>
              </div>
              <DeviceSelectionForm onGenerate={handleGenerate} canGenerate={() => true} userRole="admin" />
            </div>

            {/* Results Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Sensitivity Settings</h2>
                </div>
                {sensitivityResult && selectedDevice && (
                  <button
                    onClick={handleOpenReviewModal}
                    className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    Review
                  </button>
                )}
              </div>
              <ResultsPanel result={sensitivityResult} device={selectedDevice} />
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">World Chat Management</h2>
            </div>
            <WorldChat />
          </div>
        )}

        {activeTab === "redeem-codes" && (
          <div className="space-y-8">
            {/* Create New Code */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Create New Redeem Code</h3>
              <form onSubmit={createRedeemCode} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCode.code}
                        onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        maxLength={20}
                        required
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Uses</label>
                    <input
                      type="number"
                      value={newCode.maxUses}
                      onChange={(e) => setNewCode({ ...newCode, maxUses: Number.parseInt(e.target.value) })}
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      value={newCode.durationDays}
                      onChange={(e) => setNewCode({ ...newCode, durationDays: Number.parseInt(e.target.value) })}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newCode.code.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Code
                </button>
              </form>
            </div>

            {/* Existing Codes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Existing Redeem Codes</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Uses</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Expires</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-800 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redeemCodes.map((code) => (
                      <tr key={code.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 font-mono text-gray-800 dark:text-white">{code.code}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {code.current_uses}/{code.max_uses}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(code.expires_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              code.is_active
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {code.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleCodeStatus(code.id, code.is_active)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              code.is_active
                                ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30"
                                : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30"
                            }`}
                          >
                            {code.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "changelog" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <ListChecks className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Changelog Management</h2>
            </div>
            <Changelog />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">System Settings</h3>

            <div className="space-y-6">
              {/* Password Management */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-4">Access Passwords</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      VIP Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={vipPassword}
                        onChange={(e) => setVipPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={updateLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {updateLoading ? "Updating..." : "Update Passwords"}
                  </button>
                  {updateMessage && (
                    <span
                      className={`text-sm ${
                        updateMessage.includes("success")
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {updateMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-4">System Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalUsers}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">VIP Users</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {users.filter((u) => u.role === "vip").length}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Codes</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {redeemCodes.filter((c) => c.is_active).length}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reviews</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalReviews}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {isReviewModalOpen && selectedDevice && sensitivityResult && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={handleCloseReviewModal}
            device={selectedDevice}
            settings={sensitivityResult}
          />
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
