"use client"

import type { CachedConversation } from "@/lib/cache"
import { SCENARIOS } from "@/lib/prompts"

interface ConversationListProps {
  conversations: CachedConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function tagLabel(tag: string): string {
  if (tag === "free-talk") return "Free Talk"
  const s = SCENARIOS.find((sc) => sc.id === tag)
  return s?.name ?? tag
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-8">
            No conversations yet
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${
              activeId === conv.id
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">
                {conv.title || "Untitled"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {tagLabel(conv.tag)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(conv.id)
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-xs p-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
