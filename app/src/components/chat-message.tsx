"use client"

import { useState } from "react"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  lowConfidenceWords?: string[]
  onEdit?: (newContent: string) => void
  onReplay?: () => void
  versionCount?: number
  activeVersion?: number
  onVersionChange?: (direction: "prev" | "next") => void
}

export function ChatMessage({
  role,
  content,
  lowConfidenceWords,
  onEdit,
  onReplay,
  versionCount,
  activeVersion,
  onVersionChange,
}: ChatMessageProps) {
  const isUser = role === "user"
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)

  const [reply, correction] =
    !isUser && content.includes("---")
      ? content.split("---").map((s) => s.trim())
      : [content, null]

  const handleConfirmEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== content) {
      onEdit?.(trimmed)
    }
    setIsEditing(false)
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
        } relative`}
      >
        {isUser && isEditing ? (
          <div>
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleConfirmEdit()
                }
                if (e.key === "Escape") setIsEditing(false)
              }}
              className="w-full bg-blue-700 text-white rounded-lg px-2 py-1 text-sm outline-none resize-none min-h-[60px]"
              rows={3}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-blue-200 hover:text-white px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                className="text-xs bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{reply}</p>
            {correction && (
              <div className="mt-3 pt-3 border-t border-gray-600 text-sm text-amber-300">
                <p className="whitespace-pre-wrap">{correction}</p>
              </div>
            )}
            {isUser && lowConfidenceWords && lowConfidenceWords.length > 0 && (
              <p className="mt-2 text-xs text-blue-200 opacity-75">
                Possibly unclear: {lowConfidenceWords.join(", ")}
              </p>
            )}
          </>
        )}

        {/* Replay button for assistant messages */}
        {!isUser && onReplay && (
          <button
            onClick={onReplay}
            className="absolute -bottom-1 -right-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300"
            title="Replay"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* Edit button for user messages */}
        {isUser && !isEditing && onEdit && (
          <button
            onClick={() => {
              setEditValue(content)
              setIsEditing(true)
            }}
            className="absolute -bottom-1 -left-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Version navigation for assistant messages */}
        {!isUser && versionCount !== undefined && versionCount > 1 && activeVersion !== undefined && onVersionChange && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
            <button
              onClick={() => onVersionChange("prev")}
              disabled={activeVersion === 0}
              className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>{activeVersion + 1} / {versionCount}</span>
            <button
              onClick={() => onVersionChange("next")}
              disabled={activeVersion === versionCount - 1}
              className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
