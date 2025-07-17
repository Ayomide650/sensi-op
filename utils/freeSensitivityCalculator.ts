import type { DeviceInfo, SensitivitySettings } from "../types"

// Basic optimization factor without localStorage dependency
const getBasicOptimizationFactor = (): number => {
  // Simple static optimization factor for free version
  return 1.05 // 5% optimization boost for all users
}

// Simplified device detection - Apple vs Android only
const detectDeviceType = (deviceInfo: DeviceInfo): "apple" | "android" => {
  const deviceName = deviceInfo.name.toLowerCase()
  const brand = deviceInfo.brand?.toLowerCase() || ""

  if (brand === "apple" || deviceName.includes("iphone") || deviceName.includes("ipad")) {
    return "apple"
  }

  return "android" // Default to Android for all other devices
}

// Simplified device-specific base calculation
const getDeviceSpecificBase = (deviceInfo: DeviceInfo): number => {
  const deviceType = detectDeviceType(deviceInfo)

  // Basic Apple device handling
  if (deviceType === "apple") {
    const deviceName = deviceInfo.name.toLowerCase()

    // iPad optimization - larger screen
    if (deviceName.includes("ipad")) {
      return 155
    }

    // iPhone Pro models - basic detection
    if (deviceName.includes("pro")) {
      return 175
    }

    return 171 // Standard iPhone base
  }

  // Simplified Android calculations
  const screenSizeFactor = Math.pow(0.98, Math.max(0, (deviceInfo.screenSize - 6) / 0.5))

  // Basic processor/GPU scoring (simplified)
  const processorScore = Math.max(0, Math.min(100, deviceInfo.processorScore))
  const gpuScore = Math.max(0, Math.min(100, deviceInfo.gpuScore))
  const performanceScore = (processorScore + gpuScore) / 2

  let performanceFactor = 1

  // Simplified performance adjustments
  if (performanceScore < 60) {
    performanceFactor = 0.95 // Budget devices
  } else if (performanceScore > 85) {
    performanceFactor = 1.05 // High-end devices
  }

  // Base calculation with simplified factors
  const baseValue = 165 * screenSizeFactor * performanceFactor

  // Standard bounds
  return Math.min(185, Math.max(150, Math.round(baseValue)))
}

// Play style modifiers (kept from original)
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

// Experience level modifiers (kept from original)
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

// Advanced optimization system (without localStorage)
const getAdvancedOptimizationFactor = (deviceInfo: DeviceInfo): number => {
  const deviceType = detectDeviceType(deviceInfo)
  const performanceScore = (deviceInfo.processorScore + deviceInfo.gpuScore) / 2

  // Progressive optimization based on device performance
  let optimizationFactor = 1

  // Device type optimization
  if (deviceType === "apple") {
    optimizationFactor *= 1.03 // Apple devices get slight boost
  }

  // Performance-based optimization
  if (performanceScore > 90) {
    optimizationFactor *= 1.08 // High-end devices
  } else if (performanceScore > 75) {
    optimizationFactor *= 1.05 // Mid-high range
  } else if (performanceScore < 50) {
    optimizationFactor *= 0.95 // Budget devices need lower sensitivity
  }

  return optimizationFactor
}

// Detailed brand detection (simplified brand awareness)
const getBrandModifier = (deviceInfo: DeviceInfo): number => {
  const brand = deviceInfo.brand?.toLowerCase() || ""
  const deviceName = deviceInfo.name.toLowerCase()

  // Basic brand detection without individual factors
  if (brand.includes("samsung") || deviceName.includes("samsung")) {
    return 1.02 // Samsung slight advantage
  }

  if (brand.includes("google") || deviceName.includes("pixel")) {
    return 1.03 // Google Pixel optimization
  }

  if (brand.includes("oneplus") || deviceName.includes("oneplus")) {
    return 1.04 // OnePlus gaming focus
  }

  // Gaming phone detection
  if (
    deviceName.includes("rog") ||
    deviceName.includes("gaming") ||
    deviceName.includes("redmagic") ||
    deviceName.includes("black shark")
  ) {
    return 1.06 // Gaming phones get higher multiplier
  }

  return 1 // Default for all other brands
}

// Complex device factors (basic implementation)
const getComplexDeviceFactor = (deviceInfo: DeviceInfo): number => {
  let complexFactor = 1

  // Basic processor scoring consideration
  const processorScore = Math.max(0, Math.min(100, deviceInfo.processorScore))
  if (processorScore > 95) {
    complexFactor *= 1.05 // Top-tier processors
  } else if (processorScore < 40) {
    complexFactor *= 0.92 // Very low-end processors
  }

  // Screen size consideration (simplified)
  if (deviceInfo.screenSize > 6.5) {
    complexFactor *= 1.02 // Large screens
  } else if (deviceInfo.screenSize < 5.5) {
    complexFactor *= 0.98 // Small screens
  }

  return complexFactor
}

export const calculateSensitivity = (
  deviceInfo: DeviceInfo,
  playStyle: string,
  experienceLevel: string,
): SensitivitySettings => {
  const baseValue = getDeviceSpecificBase(deviceInfo)
  const playStyleModifier = getPlayStyleModifier(playStyle)
  const experienceModifier = getExperienceModifier(experienceLevel)
  const basicOptimization = getBasicOptimizationFactor()
  const advancedOptimization = getAdvancedOptimizationFactor(deviceInfo)
  const brandModifier = getBrandModifier(deviceInfo)
  const complexFactor = getComplexDeviceFactor(deviceInfo)

  const baseGeneral =
    baseValue *
    playStyleModifier *
    experienceModifier *
    basicOptimization *
    advancedOptimization *
    brandModifier *
    complexFactor

  // Device-specific scope multipliers (simplified)
  const deviceType = detectDeviceType(deviceInfo)
  const isHighEnd = (deviceInfo.processorScore + deviceInfo.gpuScore) / 2 > 85

  let scopeMultipliers = {
    redDot: 0.65,
    scope2x: 0.55,
    scope4x: 0.4,
    sniperScope: 0.3,
    freeLook: 0.5,
  }

  // Adjust multipliers for high-end devices
  if (isHighEnd) {
    scopeMultipliers = {
      redDot: 0.62,
      scope2x: 0.52,
      scope4x: 0.38,
      sniperScope: 0.28,
      freeLook: 0.48,
    }
  }

  // Apple devices get different ratios
  if (deviceType === "apple") {
    scopeMultipliers = {
      redDot: 0.68,
      scope2x: 0.58,
      scope4x: 0.42,
      sniperScope: 0.32,
      freeLook: 0.52,
    }
  }

  // Calculate final values with proper bounds
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

// Utility function to get basic device info
export const getBasicDeviceInfo = (
  deviceInfo: DeviceInfo,
): {
  type: string
  performance: string
  optimization: string
} => {
  const deviceType = detectDeviceType(deviceInfo)
  const performanceScore = (deviceInfo.processorScore + deviceInfo.gpuScore) / 2

  let performanceTier = "standard"
  if (performanceScore > 85) performanceTier = "high-end"
  else if (performanceScore < 60) performanceTier = "budget"

  const brandModifier = getBrandModifier(deviceInfo)
  const optimizationLevel = brandModifier > 1.03 ? "enhanced" : "standard"

  return {
    type: deviceType,
    performance: performanceTier,
    optimization: optimizationLevel,
  }
}
