"use client"

import type React from "react"
import { useState } from "react"
import {
  Smartphone,
  Settings,
  BarChart3,
  MessageSquare,
  Crown,
  Moon,
  Sun,
  Zap,
  Gift,
  X,
  LogOut,
  ListChecks,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import DeviceSelectionForm from "./DeviceSelectionForm"
import ResultsPanel from "./ResultsPanel"
import ComparisonModal from "./ComparisonModal"
import ReviewModal from "./ReviewModal"
import WorldChat from "./WorldChat"
import LoadingBar from "./LoadingBar"
import ChangelogModal from "./ChangelogModal"
import type { DeviceInfo } from "../types"
import { calculateSensitivity as calculateVipSensitivity } from "../utils/sensitivityCalculator"
import { calculateSensitivity as calculateFreeSensitivity } from "../utils/freeSensitivityCalculator"

const UserDashboard: React.FC = () => {
  const { user, redeemVipCode, signOut, canGenerate } = useAuth()
  const { theme, toggleTheme, canToggleTheme } = useTheme()
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null)
  const [result, setResult] = useState<ReturnType<typeof calculateVipSensitivity> | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showWorldChat, setShowWorldChat] = useState(false)
  const [showChangelogModal, setShowChangelogModal] = useState(false)
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingGeneration, setPendingGeneration] = useState<{
    device: DeviceInfo
    playStyle: string
    experienceLevel: string
  } | null>(null)

  const handleGenerateSettings = (device: DeviceInfo, playStyle: string, experienceLevel: string) => {
    setPendingGeneration({ device, playStyle, experienceLevel })
    setIsGenerating(true)
  }

  const handleLoadingComplete = () => {
    if (pendingGeneration) {
      const isVipOrAdmin = user?.role === "vip" || user?.role === "admin"

      // Use different calculators based on user role
      const settings = isVipOrAdmin
        ? calculateVipSensitivity(
            pendingGeneration.device,
            pendingGeneration.playStyle,
            pendingGeneration.experienceLevel,
          )
        : calculateFreeSensitivity(
            pendingGeneration.device,
            pendingGeneration.playStyle,
            pendingGeneration.experienceLevel,
          )

      setSelectedDevice(pendingGeneration.device)
      setResult(settings)
      setPendingGeneration(null)
    }
    setIsGenerating(false)
  }

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !user) {
      setRedeemError("Please enter a valid code")
      return
    }

    setRedeemLoading(true)
    setRedeemError("")

    try {
      const success = await redeemVipCode(redeemCode.trim().toUpperCase())

      if (success) {
        setShowRedeemModal(false)
        setRedeemCode("")
        setRedeemError("")
        alert("🎉 Congratulations! You have been upgraded to VIP!")
        // Force page refresh to update UI
        window.location.reload()
      } else {
        setRedeemError("Invalid or expired code. Please check and try again.")
      }
    } catch (error) {
      console.error("Redeem error:", error)
      setRedeemError("An error occurred. Please try again.")
    }

    setRedeemLoading(false)
  }

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      signOut()
    }
  }

  const isVipOrAdmin = user?.role === "vip" || user?.role === "admin"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Bar */}
        <LoadingBar isVisible={isGenerating} onComplete={handleLoadingComplete} />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome back, {user?.username}!</h1>
                <div className="flex items-center space-x-2 mt-1">
                  {isVipOrAdmin ? (
                    <>
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        {user?.role === "admin"
                          ? "Admin - Advanced Calculator & Unlimited Access"
                          : "VIP Member - Advanced Calculator & Unlimited Generations"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Free User - Basic Calculator</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              {canToggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
              )}

              {/* World Chat Button */}
              <button
                onClick={() => setShowWorldChat(!showWorldChat)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showWorldChat
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">World Chat</span>
              </button>

              {/* Changelog Button */}
              <button
                onClick={() => setShowChangelogModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ListChecks className="w-4 h-4" />
                <span className="text-sm font-medium">Changelog</span>
              </button>

              {/* Redeem Code Button (only for non-VIP users) */}
              {!isVipOrAdmin && (
                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-medium">Redeem Code</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calculator Type Notice */}
        <div
          className={`mb-6 p-4 rounded-lg border ${
            isVipOrAdmin
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {isVipOrAdmin ? (
              <>
                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Advanced Sensitivity Calculator</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You're using our premium calculator with advanced optimization, brand-specific tuning, and
                    localStorage-based learning.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Basic Sensitivity Calculator</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You're using our free calculator with simplified optimization. Upgrade to VIP for advanced features
                    and better accuracy.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* World Chat */}
        {showWorldChat && (
          <div className="mb-8">
            <WorldChat />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Selection Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Device Configuration</h2>
            </div>
            <DeviceSelectionForm
              onGenerate={handleGenerateSettings}
              canGenerate={canGenerate()}
              userRole={user?.role || "user"}
            />
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
              {result && selectedDevice && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowComparison(true)}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => setShowReview(true)}
                    className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
            <ResultsPanel result={result} device={selectedDevice} />
          </div>
        </div>

        {/* Modals */}
        {showComparison && result && selectedDevice && (
          <ComparisonModal
            isOpen={showComparison}
            onClose={() => setShowComparison(false)}
            currentResult={result}
            currentDevice={selectedDevice}
          />
        )}

        {showReview && result && selectedDevice && (
          <ReviewModal
            isOpen={showReview}
            onClose={() => setShowReview(false)}
            device={selectedDevice}
            settings={result}
          />
        )}

        {showChangelogModal && (
          <ChangelogModal isOpen={showChangelogModal} onClose={() => setShowChangelogModal(false)} />
        )}

        {/* Redeem Code Modal */}
        {showRedeemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Redeem VIP Code</h3>
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter your VIP code:
                  </label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="Enter code here..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    maxLength={20}
                  />
                </div>

                {redeemError && <div className="text-red-600 dark:text-red-400 text-sm">{redeemError}</div>}

                <div className="flex space-x-3">
                  <button
                    onClick={handleRedeemCode}
                    disabled={redeemLoading || !redeemCode.trim()}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {redeemLoading ? "Redeeming..." : "Redeem Code"}
                  </button>
                  <button
                    onClick={() => setShowRedeemModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
