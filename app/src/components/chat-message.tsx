interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  lowConfidenceWords?: string[]
}

export function ChatMessage({
  role,
  content,
  lowConfidenceWords,
}: ChatMessageProps) {
  const isUser = role === "user"

  const [reply, correction] =
    !isUser && content.includes("---")
      ? content.split("---").map((s) => s.trim())
      : [content, null]

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
        }`}
      >
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
      </div>
    </div>
  )
}
