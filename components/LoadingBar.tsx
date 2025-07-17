"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface LoadingBarProps {
  onComplete: () => void
  isVisible: boolean
}

const LoadingBar: React.FC<LoadingBarProps> = ({ onComplete, isVisible }) => {
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("Initializing...")
  const [isComplete, setIsComplete] = useState(false)

  const statusMessages = [
    "Initializing...",
    "Loading device data...",
    "Analyzing play style...",
    "Calculating sensitivity...",
    "Optimizing settings...",
    "Finalizing results...",
    "Complete!",
  ]

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setStatusMessage("Initializing...")
      setIsComplete(false)
      return
    }

    let currentProgress = 0
    let messageIndex = 0

    const interval = setInterval(() => {
      // Simulate realistic loading with variable speeds
      const increment = Math.random() * 3 + 1
      currentProgress = Math.min(currentProgress + increment, 100)

      setProgress(currentProgress)

      // Update status message based on progress
      const newMessageIndex = Math.floor((currentProgress / 100) * (statusMessages.length - 1))
      if (newMessageIndex !== messageIndex && newMessageIndex < statusMessages.length) {
        messageIndex = newMessageIndex
        setStatusMessage(statusMessages[messageIndex])
      }

      // Complete loading
      if (currentProgress >= 100) {
        clearInterval(interval)
        setIsComplete(true)
        setStatusMessage("Complete!")

        // Call onComplete after a short delay
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative">
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white/50 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-10 min-w-[400px] text-center shadow-2xl">
          <h1 className="text-white text-2xl font-light tracking-wider uppercase mb-8 opacity-0 animate-fade-in-up">
            Generating Settings
          </h1>

          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden mb-5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-yellow-400 via-green-400 via-blue-400 to-purple-500 bg-[length:200%_100%] rounded-full relative transition-all duration-300 shadow-lg animate-shimmer"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-slide" />
            </div>
          </div>

          <div
            className={`text-white text-lg font-bold mb-5 opacity-0 animate-fade-in-up ${isComplete ? "text-emerald-400" : ""}`}
          >
            {Math.round(progress)}%
          </div>

          <div className="flex justify-center gap-1 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <div
            className={`text-white/80 text-sm opacity-0 animate-fade-in-up ${isComplete ? "text-emerald-400 font-bold" : ""}`}
          >
            {statusMessage}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
        .animate-slide {
          animation: slide 1.5s infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-in-out 0.2s forwards;
        }
      `}</style>
    </div>
  )
}

export default LoadingBar
