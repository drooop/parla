"use client"

interface RecordButtonProps {
  isRecording: boolean
  isProcessing: boolean
  onMouseDown: () => void
  onMouseUp: () => void
}

export function RecordButton({
  isRecording,
  isProcessing,
  onMouseDown,
  onMouseUp,
}: RecordButtonProps) {
  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
      disabled={isProcessing}
      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all select-none ${
        isProcessing
          ? "bg-gray-700 cursor-not-allowed"
          : isRecording
            ? "bg-red-500 scale-110 shadow-lg shadow-red-500/30"
            : "bg-blue-600 hover:bg-blue-500 active:scale-95"
      }`}
    >
      {isProcessing ? (
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : isRecording ? (
        <div className="w-6 h-6 bg-white rounded-sm" />
      ) : (
        <svg
          className="w-8 h-8 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}
    </button>
  )
}
