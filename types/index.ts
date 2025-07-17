export interface Device {
  id: string
  name: string
  type: "phone" | "tablet"
  brand: string
  model: string
  screen_size_inches: number
  resolution_width_px: number
  resolution_height_px: number
  aspect_ratio: string
  dpi: number
  refresh_rate_hz: number
  processor: string
  ram_gb: number
  storage_gb: number
  battery_mah: number
  os_version: string
  release_date: string
  price_usd: number
  image_url: string
}

export interface SensitivityResult {
  general: number
  redDot: number
  _2xScope: number
  _4xScope: number
  _awmScope: number
  _freeLook: number
}

export interface DeviceInfo {
  id: string
  name: string
  type: "phone" | "tablet"
}

export interface User {
  id: string
  username: string
  role: "user" | "vip" | "admin"
  generationsToday: number
  lastGenerationDate: string
  createdAt: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  role: "user" | "vip" | "admin"
  weeklyGenerations: number
  vipExpiresAt?: string // ISO string date
}

export interface Changelog {
  id: string
  version: string
  title: string
  description: string
  changes: string[] // Array of individual changes
  is_published: boolean
  created_at: string
}
