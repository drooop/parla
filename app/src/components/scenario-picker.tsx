"use client"

import { SCENARIOS } from "@/lib/prompts"

interface ScenarioPickerProps {
  currentScenario: string | null
  onSelect: (scenarioId: string | null) => void
}

export function ScenarioPicker({
  currentScenario,
  onSelect,
}: ScenarioPickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
          currentScenario === null
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }`}
      >
        Free Talk
      </button>
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            currentScenario === s.id
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}
