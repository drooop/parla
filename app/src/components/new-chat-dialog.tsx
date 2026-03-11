"use client"

import { SCENARIOS } from "@/lib/prompts"

interface NewChatDialogProps {
  open: boolean
  onSelect: (tag: string) => void
  onClose: () => void
}

const ALL_OPTIONS = [
  { id: "free-talk", name: "Free Talk", description: "Open conversation on any topic" },
  ...SCENARIOS.map((s) => ({ id: s.id, name: s.name, description: s.description })),
]

export function NewChatDialog({ open, onSelect, onClose }: NewChatDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Choose a scenario</h2>
        <div className="flex flex-col gap-2">
          {ALL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="text-left px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <p className="text-sm font-medium text-white">{opt.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
