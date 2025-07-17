"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Send, Users, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"
import { onlineChecker } from "../utils/onlineChecker"

interface ChatMessage {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  is_deleted: boolean
}

const WorldChat: React.FC = () => {
  const { user, isOnline } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages
  useEffect(() => {
    if (!isOnline) {
      setLoading(false)
      return
    }

    loadMessages()

    // Set up real-time subscription
    const subscription = supabase
      .channel("group_chat_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_chat_messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as ChatMessage
            if (!newMsg.is_deleted) {
              setMessages((prev) => [...prev, newMsg])
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as ChatMessage
            setMessages((prev) => prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg)))
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isOnline])

  const loadMessages = async () => {
    try {
      await onlineChecker.requireOnline()

      const { data, error } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("Error loading messages:", error)
        setError("Failed to load messages")
      } else {
        setMessages(data || [])
      }
    } catch (err: any) {
      console.error("Error loading messages:", err)
      setError(err.message || "Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !newMessage.trim() || sending || !isOnline) {
      return
    }

    setSending(true)
    setError(null)

    try {
      await onlineChecker.requireOnline()

      const messageData = {
        user_id: user.id,
        username: user.username,
        message: newMessage.trim(),
      }

      const { error } = await supabase.from("group_chat_messages").insert([messageData])

      if (error) {
        throw new Error(error.message)
      }

      setNewMessage("")
    } catch (err: any) {
      console.error("Error sending message:", err)
      setError(err.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getRoleColor = (username: string) => {
    if (username.includes("Admin")) return "text-purple-600 dark:text-purple-400"
    if (user?.role === "vip") return "text-yellow-600 dark:text-yellow-400"
    return "text-blue-600 dark:text-blue-400"
  }

  const getRoleBadge = (username: string) => {
    if (username.includes("Admin")) {
      return (
        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full ml-2">
          ADMIN
        </span>
      )
    }
    return null
  }

  if (!isOnline) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">You're Offline</h3>
            <p className="text-gray-600 dark:text-gray-400">World Chat requires an internet connection</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">World Chat</h3>
          <div className="flex items-center space-x-1">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">Online</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{messages.length} messages</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-3 ${message.user_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user_id === user?.id
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-medium ${getRoleColor(message.username)}`}>{message.username}</span>
                  {getRoleBadge(message.username)}
                  <span className="text-xs opacity-75">{formatTime(message.created_at)}</span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={!user ? "Please sign in to chat" : !isOnline ? "You're offline" : "Type your message..."}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            disabled={!user || sending || !isOnline}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!user || !newMessage.trim() || sending || !isOnline}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        {/* Character count */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">{newMessage.length}/500</div>
      </form>
    </div>
  )
}

export default WorldChat
