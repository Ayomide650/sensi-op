class OnlineChecker {
  private isOnline = true
  private listeners: ((online: boolean) => void)[] = []
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine
      this.startMonitoring()
    }
  }

  private startMonitoring() {
    // Listen to browser online/offline events
    window.addEventListener("online", this.handleOnline)
    window.addEventListener("offline", this.handleOffline)

    // Periodic connectivity check
    this.checkInterval = setInterval(this.checkConnectivity, 30000)
  }

  private handleOnline = () => {
    this.setOnlineStatus(true)
  }

  private handleOffline = () => {
    this.setOnlineStatus(false)
  }

  private checkConnectivity = async () => {
    try {
      // Try to fetch from Supabase to check real connectivity
      const response = await fetch("https://etfyfigqlverqixzgmpm.supabase.co/rest/v1/", {
        method: "HEAD",
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZnlmaWdxbHZlcnFpeHpnbXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzM1MTksImV4cCI6MjA2NTUwOTUxOX0.hJYwUK7S5XJ8AZk3uc23g4-pmR6ku8-923OZ8Ml4np8",
        },
      })
      this.setOnlineStatus(response.ok)
    } catch {
      this.setOnlineStatus(false)
    }
  }

  private setOnlineStatus(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online
      this.listeners.forEach((listener) => listener(online))
    }
  }

  getStatus(): boolean {
    return this.isOnline
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.push(listener)
  }

  removeListener(listener: (online: boolean) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  async requireOnline(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("This action requires an internet connection")
    }
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline)
      window.removeEventListener("offline", this.handleOffline)
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

export const onlineChecker = new OnlineChecker()
