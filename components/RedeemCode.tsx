"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

const RedeemCode: React.FC = () => {
  const { user, redeemVipCode } = useAuth()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setMessage("Please enter a redeem code.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const success = await redeemVipCode(code.trim().toUpperCase())

      if (success) {
        setMessage("Success! You are now VIP! 🎉 Refresh the page to see changes.")
        setCode("")
      } else {
        setMessage("Invalid or expired redeem code.")
      }
    } catch (error) {
      console.error("Error redeeming code:", error)
      setMessage("An error occurred while redeeming the code.")
    } finally {
      setLoading(false)
    }
  }

  if (user?.role === "vip" || user?.role === "admin") {
    return (
      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
        <p className="text-green-800 dark:text-green-200">You already have VIP access! 🎉</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Redeem VIP Code</h3>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-medium text-yellow-800 dark:text-yellow-200">VIP Benefits</span>
        </div>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Unlimited sensitivity generations</li>
          <li>• Dark/Light theme toggle</li>
          <li>• Unlimited chat messages</li>
          <li>• Priority support</li>
        </ul>
      </div>

      <form onSubmit={handleRedeem} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter Redeem Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter your VIP code"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={20}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Redeeming..." : "Redeem Code"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.includes("Success")
              ? "bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <strong>How to get a VIP code:</strong>
        </p>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            📱 DM{" "}
            <a
              href="https://t.me/unikruzng"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              https://t.me/unikruzng
            </a>{" "}
            to get code
          </p>
          <p className="text-center font-medium">OR</p>
          <p>
            📢 Join Firekid WhatsApp channel:{" "}
            <a
              href="https://whatsapp.com/channel/0029VaT1YDxFsn0oKfK81n2R"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline break-all"
            >
              https://whatsapp.com/channel/0029VaT1YDxFsn0oKfK81n2R
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RedeemCode
