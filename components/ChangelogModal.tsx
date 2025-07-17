"use client"
import { X } from "lucide-react"
import Changelog from "./Changelog" // Import the existing Changelog component

interface ChangelogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Changelog</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close Changelog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-65px)] overflow-y-auto p-4">
          <Changelog /> {/* Render the full Changelog component inside the modal */}
        </div>
      </div>
    </div>
  )
}
