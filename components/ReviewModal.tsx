"use client"

import { useState, type FormEvent } from "react"
import { X, Star, MessageSquare } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  deviceName?: string
  deviceId?: string
}

export default function ReviewModal({ isOpen, onClose, deviceName, deviceId }: ReviewModalProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [customDeviceName, setCustomDeviceName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const needsDeviceName = !deviceName
  const finalDeviceName = deviceName || customDeviceName

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to submit a review.")
      return
    }

    if (!rating) {
      setError("Please provide a rating.")
      return
    }

    if (!finalDeviceName?.trim()) {
      setError("Device name is required.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Since you're using custom auth, we'll use the user directly from context
      const userId = user.id
      const username = user.username

      console.log("Submitting review with:", {
        userId,
        username,
        deviceName: finalDeviceName.trim(),
        rating,
        deviceId,
        comment: comment.trim() || null,
      })

      // Use Supabase RPC function with your custom auth user
      const { data, error: rpcError } = await supabase.rpc("insert_review", {
        p_user_id: userId,
        p_username: username,
        p_device_name: finalDeviceName.trim(),
        p_rating: rating,
        p_device_id: deviceId || null,
        p_comment: comment.trim() || null,
      })

      console.log("RPC Response:", data)
      console.log("RPC Error:", rpcError)

      if (rpcError) {
        console.error("RPC Error:", rpcError)
        setError(`Database error: ${rpcError.message}`)
        return
      }

      // Check if the RPC function returned an error
      if (data && !data.success) {
        console.error("Review submission failed:", data.error)
        setError(data.error || "Failed to submit review.")
        return
      }

      // Success
      alert("Thank you for your review! It has been submitted successfully.")
      handleClose()
    } catch (err) {
      console.error("Error submitting review:", err)
      setError(err instanceof Error ? `Error: ${err.message}` : "Unexpected error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setRating(0)
    setComment("")
    setCustomDeviceName("")
    setError("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Submit Review</h2>
          </div>
          <button
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={handleClose}
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {deviceName ? (
            <>
              Review your experience with <span className="font-medium">{deviceName}</span>
            </>
          ) : (
            "Share your experience with a device"
          )}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device Name Input (only if not provided as prop) */}
          {needsDeviceName && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Device Name *</label>
              <input
                type="text"
                disabled={loading}
                value={customDeviceName}
                onChange={(e) => setCustomDeviceName(e.target.value)}
                placeholder="Enter device name (e.g., iPhone 15, Samsung Galaxy S24)"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-transparent focus:ring-2 focus:ring-green-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Rating *</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={loading}
                  onClick={() => setRating(star)}
                  className={`rounded p-1 transition-colors disabled:opacity-50 ${
                    star <= rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"
                  } hover:text-yellow-500`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {rating} star{rating !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Comment (optional)
            </label>
            <textarea
              rows={4}
              maxLength={500}
              disabled={loading}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this device…"
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{comment.length}/500 characters</p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !rating || !finalDeviceName?.trim()}
              className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white transition-all hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
