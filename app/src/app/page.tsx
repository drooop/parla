"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { ChatMessage } from "@/components/chat-message"
import { RecordButton } from "@/components/record-button"
import { ConversationList } from "@/components/conversation-list"
import { NewChatDialog } from "@/components/new-chat-dialog"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import {
  transcribe,
  chat,
  synthesize,
  type ChatMessage as ChatMsg,
} from "@/lib/api"
import {
  SYSTEM_PROMPT_FREE_TALK,
  SYSTEM_PROMPT_SCENARIO,
  SCENARIOS,
} from "@/lib/prompts"
import {
  type CachedConversation,
  type CachedMessage,
  getCachedConversations,
  setCachedConversations,
  upsertCachedConversation,
  removeCachedConversation,
  getCachedMessages,
  getCachedMessageVersion,
  setCachedMessages,
  appendCachedMessages,
} from "@/lib/cache"
import {
  fetchConversations,
  createConversation,
  deleteConversation,
  updateConversationTitle,
  fetchMessages,
  appendMessages,
  generateTitle,
} from "@/lib/conversations-api"

interface Message {
  role: "user" | "assistant"
  content: string
  lowConfidenceWords?: string[]
}

const LOW_CONFIDENCE_THRESHOLD = 0.6

export default function Home() {
  const [conversations, setConversations] = useState<CachedConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)

  const { isRecording, startRecording, stopRecording } = useAudioRecorder()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null

  // Load conversations on mount
  useEffect(() => {
    const cached = getCachedConversations()
    if (cached.length > 0) {
      setConversations(cached)
    }

    fetchConversations()
      .then((remote) => {
        setConversations(remote)
        setCachedConversations(remote)
      })
      .catch(() => {
        // DB not available, use cache-only mode
      })
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    const ctx = audioContextRef.current
    const audioBuffer = await ctx.decodeAudioData(audioData)
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.start()
  }, [])

  const getSystemPrompt = useCallback((tag: string) => {
    if (tag === "free-talk") return SYSTEM_PROMPT_FREE_TALK
    const s = SCENARIOS.find((sc) => sc.id === tag)
    return s ? SYSTEM_PROMPT_SCENARIO(s.description) : SYSTEM_PROMPT_FREE_TALK
  }, [])

  // Select a conversation: load messages from cache or DB
  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveConvId(id)

      const conv = conversations.find((c) => c.id === id)
      const cached = getCachedMessages(id)
      const cachedVersion = getCachedMessageVersion(id)

      if (cached && conv && cachedVersion >= conv.version) {
        // Cache is up to date
        setMessages(cached)
        setTimeout(scrollToBottom, 50)
        return
      }

      if (cached && cached.length > 0) {
        // Cache exists but may be stale - show what we have, then fetch delta
        setMessages(cached)
        try {
          const { messages: newMsgs, version } = await fetchMessages(id, cached.length)
          if (newMsgs.length > 0) {
            const updated = [...cached, ...newMsgs]
            setMessages(updated)
            setCachedMessages(id, updated, version)
          } else {
            setCachedMessages(id, cached, version)
          }
        } catch {
          // DB unavailable, use cache
        }
      } else {
        // No cache - full fetch
        try {
          const { messages: allMsgs, version } = await fetchMessages(id)
          setMessages(allMsgs)
          setCachedMessages(id, allMsgs, version)
        } catch {
          setMessages([])
        }
      }

      setTimeout(scrollToBottom, 50)
    },
    [conversations, scrollToBottom]
  )

  // Create new conversation
  const handleNewChat = useCallback(
    async (tag: string) => {
      setShowNewChat(false)

      try {
        const conv = await createConversation(tag)
        const updated = [conv, ...conversations]
        setConversations(updated)
        setCachedConversations(updated)
        upsertCachedConversation(conv)
        setActiveConvId(conv.id)
        setMessages([])
      } catch {
        // DB unavailable - create local-only conversation
        const localConv: CachedConversation = {
          id: crypto.randomUUID(),
          title: null,
          tag,
          msgCount: 0,
          version: 0,
          updatedAt: new Date().toISOString(),
        }
        const updated = [localConv, ...conversations]
        setConversations(updated)
        setCachedConversations(updated)
        setActiveConvId(localConv.id)
        setMessages([])
      }
    },
    [conversations]
  )

  // Delete conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      const updated = conversations.filter((c) => c.id !== id)
      setConversations(updated)
      setCachedConversations(updated)
      removeCachedConversation(id)

      if (activeConvId === id) {
        setActiveConvId(null)
        setMessages([])
      }

      try {
        await deleteConversation(id)
      } catch {
        // DB unavailable, already removed from cache
      }
    },
    [conversations, activeConvId]
  )

  // Edit title
  const handleTitleSubmit = useCallback(
    async (newTitle: string) => {
      setEditingTitle(false)
      if (!activeConvId || !newTitle.trim()) return

      const conv = conversations.find((c) => c.id === activeConvId)
      if (!conv) return

      const updatedConv = { ...conv, title: newTitle.trim() }
      upsertCachedConversation(updatedConv)
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? updatedConv : c))
      )

      try {
        await updateConversationTitle(activeConvId, newTitle.trim())
      } catch {
        // DB unavailable
      }
    },
    [activeConvId, conversations]
  )

  // Record handlers
  const handleRecordStart = useCallback(async () => {
    try {
      await startRecording()
    } catch {
      // microphone permission denied
    }
  }, [startRecording])

  const handleRecordStop = useCallback(async () => {
    const audioBlob = await stopRecording()
    if (!audioBlob || !activeConvId || !activeConv) return

    setIsProcessing(true)

    try {
      // 1. Speech to text
      const sttResult = await transcribe(audioBlob)
      if (!sttResult.text.trim()) {
        setIsProcessing(false)
        return
      }

      const lowConfidenceWords = sttResult.words
        .filter((w) => w.probability < LOW_CONFIDENCE_THRESHOLD)
        .map((w) => w.word)

      const userMessage: Message = {
        role: "user",
        content: sttResult.text,
        lowConfidenceWords,
      }

      const isFirstMessage = messages.length === 0

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setTimeout(scrollToBottom, 50)

      // 2. Chat with LLM
      const chatMessages: ChatMsg[] = [
        { role: "system", content: getSystemPrompt(activeConv.tag) },
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ]

      const reply = await chat(chatMessages)

      const assistantMessage: Message = {
        role: "assistant",
        content: reply,
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      setTimeout(scrollToBottom, 50)

      // 3. Persist to DB (async, non-blocking for TTS)
      const persistPromise = appendMessages(activeConvId, [userMessage, assistantMessage])
        .then(({ version, msgCount }) => {
          const updatedConv = { ...activeConv, version, msgCount, updatedAt: new Date().toISOString() }
          upsertCachedConversation(updatedConv)
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? updatedConv : c))
          )
          appendCachedMessages(activeConvId, [userMessage, assistantMessage], version)
        })
        .catch(() => {
          // DB unavailable - cache-only
          appendCachedMessages(activeConvId, [userMessage, assistantMessage], activeConv.version)
        })

      // 4. Generate title after first message (async, fire-and-forget)
      if (isFirstMessage) {
        generateTitle(activeConvId, sttResult.text)
          .then((title) => {
            upsertCachedConversation({ ...activeConv, title })
            setConversations((prev) =>
              prev.map((c) => (c.id === activeConvId ? { ...c, title } : c))
            )
          })
          .catch(() => {})
      }

      // 5. TTS (only the reply part, not corrections)
      const replyText = reply.includes("---")
        ? reply.split("---")[0].trim()
        : reply
      const audioData = await synthesize(replyText)
      await playAudio(audioData)

      await persistPromise
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error"
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errMsg}` },
      ])
    } finally {
      setIsProcessing(false)
    }
  }, [stopRecording, activeConvId, activeConv, messages, getSystemPrompt, scrollToBottom, playAudio])

  // Hold spacebar to record
  useEffect(() => {
    const spaceHeldRef = { current: false }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      e.preventDefault()
      if (!spaceHeldRef.current) {
        spaceHeldRef.current = true
        handleRecordStart()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      e.preventDefault()
      if (spaceHeldRef.current) {
        spaceHeldRef.current = false
        handleRecordStop()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [handleRecordStart, handleRecordStop])

  const tagLabel = activeConv
    ? activeConv.tag === "free-talk"
      ? "Free Talk"
      : SCENARIOS.find((s) => s.id === activeConv.tag)?.name ?? activeConv.tag
    : null

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all overflow-hidden`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={() => setShowNewChat(true)}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {activeConv ? (
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  autoFocus
                  defaultValue={activeConv.title || ""}
                  placeholder="Enter title..."
                  className="bg-transparent text-white text-sm font-semibold outline-none border-b border-blue-500 w-full"
                  onBlur={(e) => handleTitleSubmit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSubmit((e.target as HTMLInputElement).value)
                    if (e.key === "Escape") setEditingTitle(false)
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-sm font-semibold text-white truncate hover:text-blue-400 transition-colors"
                  title="Click to edit title"
                >
                  {activeConv.title || "Untitled"}
                </button>
              )}
              {tagLabel && (
                <p className="text-xs text-gray-500">{tagLabel}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="text-sm font-semibold text-gray-300">Parla</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <p>Select a conversation or start a new one</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
              >
                + New Chat
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Hold the button or press Space to speak</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                lowConfidenceWords={msg.lowConfidenceWords}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {activeConvId && (
          <div className="flex justify-center py-6 border-t border-gray-800">
            <RecordButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onMouseDown={handleRecordStart}
              onMouseUp={handleRecordStop}
            />
          </div>
        )}
      </main>

      <NewChatDialog
        open={showNewChat}
        onSelect={handleNewChat}
        onClose={() => setShowNewChat(false)}
      />
    </div>
  )
}
