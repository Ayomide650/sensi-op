"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

const GamepadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7.97 16c-.85 0-1.61-.54-1.89-1.34L4.55 11H3c-.55 0-1-.45-1-1s.45-1 1-1h2c.39 0 .74.23.9.59l1.42 3.11c.08.18.26.3.46.3s.38-.12.46-.3L9.1 9.59c.16-.36.51-.59.9-.59h4c.39 0 .74.23.9.59l.86 1.88c.08.18.26.3.46.3s.38-.12.46-.3l1.42-3.11c.16-.36.51-.59.9-.59h2c.55 0 1 .45 1 1s-.45 1-1 1h-1.55l-1.53 3.66c-.28.8-1.04 1.34-1.89 1.34-.85 0-1.61-.54-1.89-1.34L15.5 11h-7l-.86 1.88C7.36 13.68 6.6 14.22 5.75 14.22z" />
  </svg>
)

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    adminKey: "",
  })
  const [localError, setLocalError] = useState("")

  const { signIn, signUp, adminSignIn, loading, error: authError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError("")

    try {
      if (showAdminLogin) {
        if (!formData.adminKey.trim()) {
          setLocalError("Admin key is required")
          return
        }
        console.log("Attempting admin sign in...")
        await adminSignIn(formData.adminKey)
      } else if (isLogin) {
        if (!formData.username.trim() || !formData.password.trim()) {
          setLocalError("Username and password are required")
          return
        }
        console.log("Attempting sign in with username:", formData.username)
        await signIn(formData.username, formData.password)
      } else {
        if (!formData.username.trim() || !formData.password.trim()) {
          setLocalError("Username and password are required")
          return
        }
        if (formData.username.length < 3) {
          setLocalError("Username must be at least 3 characters")
          return
        }
        if (formData.password.length < 6) {
          setLocalError("Password must be at least 6 characters")
          return
        }
        console.log("Attempting sign up with username:", formData.username)
        await signUp(formData.username, formData.password)
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      setLocalError(err.message || "An error occurred")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const resetForm = () => {
    setFormData({ username: "", password: "", adminKey: "" })
    setLocalError("")
  }

  const displayError = localError || authError

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600">
      {/* Simplified Background with fewer particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Reduced particles - only 6 instead of 20 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `simpleFloat ${6 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          />
        ))}

        {/* Single decorative blob */}
        <div
          className="absolute opacity-20 w-96 h-96 rounded-full"
          style={{
            top: "20%",
            left: "10%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)",
            animation: "gentleFloat 20s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-4 shadow-lg border border-white/30">
            <GamepadIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Sensi-Gen</h1>
          <p className="text-white/80">Free Fire Sensitivity Generator</p>
        </div>

        {/* Admin Key Toggle */}
        <div className="text-center mb-4">
          <button
            type="button"
            onClick={() => {
              setShowAdminLogin(!showAdminLogin)
              resetForm()
            }}
            className="text-sm text-white/90 hover:text-white underline bg-white/10 px-3 py-1 rounded-full transition-colors duration-200 hover:bg-white/20"
          >
            {showAdminLogin ? "← Back to User Login" : "🔑 Admin Access"}
          </button>
        </div>

        {/* Auth Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {!showAdminLogin && (
            <div className="mb-6">
              <div className="flex rounded-lg bg-white/10 p-1 border border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true)
                    resetForm()
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    isLogin ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false)
                    resetForm()
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    !isLogin ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {showAdminLogin ? (
              <div>
                <label htmlFor="adminKey" className="block text-sm font-medium text-white/90 mb-2">
                  Admin Key
                </label>
                <input
                  id="adminKey"
                  name="adminKey"
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/60 border border-white/20 focus:border-white/40 focus:outline-none transition-colors duration-200"
                  placeholder="Enter admin key"
                  value={formData.adminKey}
                  onChange={handleChange}
                />
                <p className="text-xs text-white/50 mt-1">Contact administrator for access key</p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/60 border border-white/20 focus:border-white/40 focus:outline-none transition-colors duration-200"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-white/60 border border-white/20 focus:border-white/40 focus:outline-none transition-colors duration-200"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {displayError && (
              <div className="bg-red-500/20 border border-red-300/30 rounded-lg p-4">
                <div className="text-red-100 text-sm">{displayError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white/20 hover:border-white/30"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : showAdminLogin ? (
                "Access Admin Panel"
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* VIP Notice */}
          {!showAdminLogin && (
            <div className="mt-6 p-4 bg-white/10 border border-white/20 rounded-lg">
              <div className="text-white/90 text-sm">
                <p className="font-medium">🎫 Want VIP Access?</p>
                <p className="text-white/70">
                  Use redeem codes to unlock unlimited generations and exclusive features!
                </p>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="mt-4 p-3 bg-black/20 rounded-lg">
            <p className="text-xs text-white/60">Dont forget your password, thats all i have to say</p>
          </div>
        </div>
      </div>

      {/* Simplified CSS Animations */}
      <style jsx>{`
        @keyframes simpleFloat {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.6;
          }
        }
        
        @keyframes gentleFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}

export default AuthPage
