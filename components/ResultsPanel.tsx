"use client"

import type React from "react"
import { useState } from "react"
import { Copy, Download, Share2, Check } from "lucide-react"
import type { DeviceInfo, SensitivitySettings } from "../types"

interface ResultsPanelProps {
  result?: SensitivitySettings | null
  device?: DeviceInfo | null
  settings?: SensitivitySettings | null
  playStyle?: string
  experienceLevel?: string
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  device,
  settings,
  playStyle = "",
  experienceLevel = "",
}) => {
  const [copied, setCopied] = useState(false)

  // Use either result or settings prop
  const sensitivityData = result || settings

  if (!sensitivityData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">No Settings Generated</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Select your device and preferences to generate optimized sensitivity settings.
          </p>
        </div>
      </div>
    )
  }

  const deviceName = device?.name || "Unknown Device"

  // Settings
  const settingsData = [
    { label: "General", value: sensitivityData.general ?? 0 },
    { label: "Red Dot", value: sensitivityData.redDot ?? 0 },
    { label: "2x Scope", value: sensitivityData.scope2x ?? 0 },
    { label: "4x Scope", value: sensitivityData.scope4x ?? 0 },
    { label: "Sniper Scope", value: sensitivityData.sniperScope ?? 0 },
    { label: "Free Look", value: sensitivityData.freeLook ?? 0 },
  ]

  const handleCopySettings = async () => {
    const settingsText = `
Device: ${deviceName}
Play Style: ${playStyle || "Not specified"}
Experience: ${experienceLevel || "Not specified"}

Sensitivity Settings:
${settingsData.map(setting => `- ${setting.label}: ${setting.value}`).join('\n')}
    `.trim()

    try {
      await navigator.clipboard.writeText(settingsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy settings:", err)
    }
  }

  const handleExportSettings = () => {
    if (!device) return

    // Create canvas for image export
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 600
    
    // Black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 800, 600)
    
    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Sensitivity Settings', 400, 50)
    
    // Device name
    ctx.fillStyle = '#9ca3af'
    ctx.font = '18px Arial'
    ctx.fillText(`Device: ${deviceName}`, 400, 80)
    
    // Settings grid
    const cardWidth = 350
    const cardHeight = 80
    const startX = 25
    const startY = 120
    const gap = 20
    
    settingsData.forEach((setting, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      const x = startX + col * (cardWidth + gap)
      const y = startY + row * (cardHeight + gap)
      
      // Card background with subtle border
      ctx.fillStyle = '#1f2937'
      ctx.fillRect(x, y, cardWidth, cardHeight)
      
      // Card border
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, cardWidth, cardHeight)
      
      // Setting label
      ctx.fillStyle = '#9ca3af'
      ctx.font = '16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(setting.label, x + 20, y + 30)
      
      // Setting value
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(setting.value.toString(), x + cardWidth - 20, y + 50)
    })
    
    // Footer
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, 400, 580)
    
    // Download the image
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sensitivity-settings-${deviceName.toLowerCase().replace(/\s+/g, "-")}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  const handleShareSettings = async () => {
    const settingsText = `Check out my sensitivity settings for ${deviceName}!\n\n${settingsData.map(setting => `${setting.label}: ${setting.value}`).join('\n')}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Sensitivity Settings",
          text: settingsText,
        })
      } catch (err) {
        console.error("Error sharing:", err)
        handleCopySettings()
      }
    } else {
      handleCopySettings()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Optimized Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Device: <span className="font-medium">{deviceName}</span>
          {playStyle && (
            <>
              {" • "}
              <span className="font-medium">{playStyle}</span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">General</h4>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {sensitivityData.general ?? 0}
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Red Dot</h4>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {sensitivityData.redDot ?? 0}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">2x Scope</h4>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {sensitivityData.scope2x ?? 0}
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">4x Scope</h4>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {sensitivityData.scope4x ?? 0}
          </p>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Sniper Scope</h4>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{sensitivityData.sniperScope ?? 0}</p>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">Free Look</h4>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            {sensitivityData.freeLook ?? 0}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopySettings}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-sm font-medium">{copied ? "Copied!" : "Copy"}</span>
        </button>

        {device && (
          <button
            onClick={handleExportSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        )}

        <button
          onClick={handleShareSettings}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share</span>
        </button>
      </div>
    </div>
  )
}

export default ResultsPanel
