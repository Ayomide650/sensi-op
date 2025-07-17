import type React from "react"

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-300">Generating settings...</span>
    </div>
  )
}

export default LoadingIndicator
