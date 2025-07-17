import type { DeviceInfo, SensitivitySettings } from "../types"

// Cache for optimization calculations to avoid repeated localStorage access
let optimizationCache: { timestamp: number; factor: number; lastCalculated: number } | null = null

const getOptimizationTimestamp = (): number => {
  try {
    const stored = localStorage.getItem("sensitivityOptimizationTimestamp")
    if (!stored) {
      const timestamp = Date.now()
      localStorage.setItem("sensitivityOptimizationTimestamp", timestamp.toString())
      return timestamp
    }
    return Number.parseInt(stored, 10)
  } catch (error) {
    // Fallback if localStorage is unavailable
    return Date.now()
  }
}

const getDaysElapsed = (timestamp: number): number => {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((Date.now() - timestamp) / msPerDay)
}

const getOptimizationFactor = (): number => {
  const now = Date.now()

  // Use cache if it's less than 1 hour old
  if (optimizationCache && now - optimizationCache.lastCalculated < 3600000) {
    return optimizationCache.factor
  }

  const timestamp = getOptimizationTimestamp()
  const daysElapsed = getDaysElapsed(timestamp)
  const optimizationDays = Math.min(daysElapsed, 7)
  const factor = 1 + optimizationDays * 0.02143

  // Cache the result
  optimizationCache = {
    timestamp,
    factor,
    lastCalculated: now,
  }

  return factor
}

// Enhanced device detection with better brand matching
const detectDeviceBrand = (deviceInfo: DeviceInfo): string => {
  const deviceName = deviceInfo.name.toLowerCase()
  const brand = deviceInfo.brand?.toLowerCase() || ""

  if (brand === "apple" || deviceName.includes("iphone") || deviceName.includes("ipad")) {
    return "apple"
  }

  // Enhanced Android brand detection
  const androidBrands = ["samsung", "google", "oneplus", "xiaomi", "oppo", "vivo", "huawei", "realme", "asus", "sony"]
  for (const androidBrand of androidBrands) {
    if (brand.includes(androidBrand) || deviceName.includes(androidBrand)) {
      return androidBrand
    }
  }

  return "android" // Default fallback
}

const getDeviceSpecificBase = (deviceInfo: DeviceInfo): number => {
  const brand = detectDeviceBrand(deviceInfo)

  // Optimized Apple device handling
  if (brand === "apple") {
    const deviceName = deviceInfo.name.toLowerCase()

    // iPad optimization - larger screen, different ergonomics
    if (deviceName.includes("ipad")) {
      return 155 // Lower base for tablets due to larger screen
    }

    // iPhone Pro models - better performance optimization
    if (deviceName.includes("pro") || deviceInfo.processorScore > 95) {
      return 175 // Slightly higher for Pro models
    }

    return 171 // Standard iPhone base
  }

  // Enhanced Android calculations with brand-specific optimizations
  const screenSizeFactor = Math.pow(0.98, Math.max(0, (deviceInfo.screenSize - 6) / 0.5))
  const refreshRateFactor = Math.log10(Math.max(60, deviceInfo.refreshRate) / 60) * 0.15 + 1
  const ramFactor = deviceInfo.ram ? Math.min(1.15, Math.pow(1.03, Math.max(0, deviceInfo.ram - 4))) : 1
  const ageFactor = Math.pow(1.02, Math.max(0, Math.min(5, deviceInfo.releaseYear - 2020)))

  // Enhanced performance calculation
  const processorScore = Math.max(0, Math.min(100, deviceInfo.processorScore))
  const gpuScore = Math.max(0, Math.min(100, deviceInfo.gpuScore))
  const performanceScore = (processorScore + gpuScore) / 2

  let performanceFactor = 1
  let brandFactor = 1

  // Performance-based adjustments with more granular scaling
  if (performanceScore < 60) {
    performanceFactor = 0.95 // Budget devices
  } else if (performanceScore < 70) {
    performanceFactor = 0.98 // Lower-mid range
  } else if (performanceScore > 85) {
    performanceFactor = 1.05 // High-end devices
  } else if (performanceScore > 95) {
    performanceFactor = 1.08 // Flagship devices
  }

  // Brand-specific optimizations
  switch (brand) {
    case "samsung":
      brandFactor = 1.02 // Samsung's One UI optimizations
      break
    case "google":
      brandFactor = 1.03 // Stock Android optimization
      break
    case "oneplus":
      brandFactor = 1.04 // Gaming-focused optimizations
      break
    case "asus":
      brandFactor = 1.05 // ROG gaming phones
      break
    case "xiaomi":
    case "oppo":
    case "vivo":
      brandFactor = 0.99 // Slightly conservative for these brands
      break
    default:
      brandFactor = 1
  }

  // Base calculation with all factors
  const baseValue = 165 * screenSizeFactor * refreshRateFactor * ramFactor * ageFactor * performanceFactor * brandFactor

  // Tighter bounds with brand considerations
  const minValue = brand === "asus" ? 160 : 150 // Higher minimum for gaming phones
  const maxValue = 185

  return Math.min(maxValue, Math.max(minValue, Math.round(baseValue)))
}

// Enhanced modifier calculations
const getPlayStyleModifier = (playStyle: string): number => {
  switch (playStyle.toLowerCase()) {
    case "aggressive":
    case "rusher":
      return 1.12
    case "precise":
    case "sniper":
      return 0.88
    case "balanced":
    case "versatile":
      return 1
    case "defensive":
      return 0.94
    default:
      return 1
  }
}

const getExperienceModifier = (experienceLevel: string): number => {
  switch (experienceLevel.toLowerCase()) {
    case "beginner":
    case "novice":
      return 0.92
    case "intermediate":
    case "casual":
      return 0.98
    case "advanced":
    case "experienced":
      return 1.08
    case "professional":
    case "expert":
      return 1.12
    default:
      return 1
  }
}

export const calculateSensitivity = (
  deviceInfo: DeviceInfo,
  playStyle: string,
  experienceLevel: string,
): SensitivitySettings => {
  const baseValue = getDeviceSpecificBase(deviceInfo)
  const playStyleModifier = getPlayStyleModifier(playStyle)
  const experienceModifier = getExperienceModifier(experienceLevel)
  const optimizationFactor = getOptimizationFactor()

  const baseGeneral = baseValue * playStyleModifier * experienceModifier * optimizationFactor

  // Device-specific scope multipliers
  const brand = detectDeviceBrand(deviceInfo)
  const isHighEnd = (deviceInfo.processorScore + deviceInfo.gpuScore) / 2 > 85

  // Adjusted multipliers with device considerations
  let scopeMultipliers = {
    redDot: 0.65,
    scope2x: 0.55,
    scope4x: 0.4,
    sniperScope: 0.3,
    freeLook: 0.5,
  }

  // Fine-tune multipliers for high-end devices (better precision capability)
  if (isHighEnd) {
    scopeMultipliers = {
      redDot: 0.62,
      scope2x: 0.52,
      scope4x: 0.38,
      sniperScope: 0.28,
      freeLook: 0.48,
    }
  }

  // Apple devices tend to need slightly different ratios
  if (brand === "apple") {
    scopeMultipliers = {
      redDot: 0.68,
      scope2x: 0.58,
      scope4x: 0.42,
      sniperScope: 0.32,
      freeLook: 0.52,
    }
  }

  // Calculate final values with improved rounding
  const general = Math.min(200, Math.max(50, Math.round(baseGeneral)))
  const redDot = Math.min(200, Math.max(30, Math.round(baseGeneral * scopeMultipliers.redDot)))
  const scope2x = Math.min(200, Math.max(25, Math.round(baseGeneral * scopeMultipliers.scope2x)))
  const scope4x = Math.min(200, Math.max(20, Math.round(baseGeneral * scopeMultipliers.scope4x)))
  const sniperScope = Math.min(200, Math.max(15, Math.round(baseGeneral * scopeMultipliers.sniperScope)))
  const freeLook = Math.min(200, Math.max(25, Math.round(baseGeneral * scopeMultipliers.freeLook)))

  return {
    general,
    redDot,
    scope2x,
    scope4x,
    sniperScope,
    freeLook,
  }
}

// Utility function to get device performance tier
export const getDevicePerformanceTier = (deviceInfo: DeviceInfo): "budget" | "mid-range" | "high-end" | "flagship" => {
  const performanceScore = (deviceInfo.processorScore + deviceInfo.gpuScore) / 2

  if (performanceScore < 60) return "budget"
  if (performanceScore < 75) return "mid-range"
  if (performanceScore < 90) return "high-end"
  return "flagship"
}

// Utility function to reset optimization cache (useful for testing)
export const resetOptimizationCache = (): void => {
  optimizationCache = null
  try {
    localStorage.removeItem("sensitivityOptimizationTimestamp")
  } catch (error) {
    // Silently handle localStorage errors
  }
}
