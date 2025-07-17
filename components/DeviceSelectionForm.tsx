"use client"

import type React from "react"
import { useState } from "react"
import { Smartphone, Zap, Crown, Lock, Search } from "lucide-react"
import { deviceDatabase } from "../data/deviceDatabase"
import type { DeviceInfo } from "../types"

interface DeviceSelectionFormProps {
  onGenerate: (device: DeviceInfo, playStyle: string, experienceLevel: string) => void
  canGenerate: boolean
  userRole: string
}

const DeviceSelectionForm: React.FC<DeviceSelectionFormProps> = ({ onGenerate, canGenerate, userRole }) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null)
  const [playStyle, setPlayStyle] = useState<string>("balanced")
  const [experienceLevel, setExperienceLevel] = useState<string>("intermediate")
  const [searchTerm, setSearchTerm] = useState("")

  // Handle deviceDatabase as an object with device names as keys
  const deviceNames = Object.keys(deviceDatabase || {})
  const filteredDevices = deviceNames.filter((name) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isVipOrAdmin = userRole === "vip" || userRole === "admin"

  const handleDeviceSelect = (deviceName: string) => {
    const deviceData = deviceDatabase[deviceName]
    if (deviceData) {
      const device: DeviceInfo = {
        name: deviceName,
        ...deviceData,
        detectionMethod: "manual",
      }
      setSelectedDevice(device)
      setSearchTerm("") // Clear search after selection
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDevice) {
      alert("Please select a device")
      return
    }

    if (!canGenerate) {
      alert("You cannot generate settings at this time. Please check your internet connection.")
      return
    }

    onGenerate(selectedDevice, playStyle, experienceLevel)
  }

  const playStyleOptions = [
    {
      value: "aggressive",
      label: "Aggressive",
      description: "High sensitivity for quick reactions",
      icon: <Zap className="w-4 h-4" />,
      disabled: !isVipOrAdmin,
    },
    {
      value: "balanced",
      label: "Balanced",
      description: "Moderate sensitivity for versatile gameplay",
      icon: <Smartphone className="w-4 h-4" />,
      disabled: false,
    },
    {
      value: "precise",
      label: "Precise",
      description: "Lower sensitivity for accurate aiming",
      icon: <Crown className="w-4 h-4" />,
      disabled: !isVipOrAdmin,
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Device Search and Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Your Device</label>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search for your device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Device Dropdown */}
        {searchTerm && (
          <div className="mb-4 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
            {filteredDevices.map((deviceName) => (
              <button
                key={deviceName}
                type="button"
                onClick={() => handleDeviceSelect(deviceName)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                {deviceName}
              </button>
            ))}
          </div>
        )}

        {/* Selected Device Display */}
        {selectedDevice && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-md">
            <p className="text-green-800 dark:text-green-200">Selected: {selectedDevice.name}</p>
          </div>
        )}

        {filteredDevices.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No devices found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Play Style Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Play Style
          {!isVipOrAdmin && (
            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(Upgrade to VIP for more options)</span>
          )}
        </label>
        <div className="grid grid-cols-1 gap-3">
          {playStyleOptions.map((option) => (
            <div
              key={option.value}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                option.disabled
                  ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                  : playStyle === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              onClick={() => !option.disabled && setPlayStyle(option.value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      option.disabled
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-400"
                        : playStyle === option.value
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <h3
                      className={`font-medium ${
                        option.disabled ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {option.label}
                    </h3>
                    <p
                      className={`text-sm ${
                        option.disabled ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {option.disabled && (
                    <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs font-medium">VIP</span>
                    </div>
                  )}
                  <input
                    type="radio"
                    name="playStyle"
                    value={option.value}
                    checked={playStyle === option.value}
                    onChange={() => !option.disabled && setPlayStyle(option.value)}
                    disabled={option.disabled}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Experience Level</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ].map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setExperienceLevel(level.value)}
              className={`px-4 py-3 rounded-lg border font-medium transition-colors ${
                experienceLevel === level.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="submit"
        disabled={!canGenerate || !selectedDevice}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
      >
        {!canGenerate ? "Cannot Generate (Offline)" : "Generate Sensitivity Settings"}
      </button>

      {/* VIP Upgrade Notice for Regular Users */}
      {!isVipOrAdmin && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Unlock More Play Styles</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Upgrade to VIP to access Aggressive and Precise play styles for more customized sensitivity settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

export default DeviceSelectionForm
