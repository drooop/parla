export interface CachedConversation {
  id: string
  title: string | null
  tag: string
  msgCount: number
  version: number
  updatedAt: string
}

export interface CachedMessage {
  role: "user" | "assistant"
  content: string
  lowConfidenceWords?: string[]
}

interface CacheData {
  conversations: CachedConversation[]
  messages: Record<string, CachedMessage[]> // key = conversation id
  messageVersions: Record<string, number>   // key = conversation id → version when messages were last fetched
}

const CACHE_KEY = "english-coach-cache"

function load(): CacheData {
  if (typeof window === "undefined") {
    return { conversations: [], messages: {}, messageVersions: {} }
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return { conversations: [], messages: {}, messageVersions: {} }
    return JSON.parse(raw)
  } catch {
    return { conversations: [], messages: {}, messageVersions: {} }
  }
}

function save(data: CacheData) {
  if (typeof window === "undefined") return
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

export function getCachedConversations(): CachedConversation[] {
  return load().conversations
}

export function setCachedConversations(conversations: CachedConversation[]) {
  const data = load()
  data.conversations = conversations
  save(data)
}

export function upsertCachedConversation(conv: CachedConversation) {
  const data = load()
  const idx = data.conversations.findIndex((c) => c.id === conv.id)
  if (idx >= 0) {
    data.conversations[idx] = conv
  } else {
    data.conversations.unshift(conv)
  }
  save(data)
}

export function removeCachedConversation(id: string) {
  const data = load()
  data.conversations = data.conversations.filter((c) => c.id !== id)
  delete data.messages[id]
  delete data.messageVersions[id]
  save(data)
}

export function getCachedMessages(conversationId: string): CachedMessage[] | null {
  const data = load()
  return data.messages[conversationId] ?? null
}

export function getCachedMessageVersion(conversationId: string): number {
  const data = load()
  return data.messageVersions[conversationId] ?? 0
}

export function setCachedMessages(conversationId: string, messages: CachedMessage[], version: number) {
  const data = load()
  data.messages[conversationId] = messages
  data.messageVersions[conversationId] = version
  save(data)
}

export function appendCachedMessages(conversationId: string, newMessages: CachedMessage[], version: number) {
  const data = load()
  const existing = data.messages[conversationId] ?? []
  data.messages[conversationId] = [...existing, ...newMessages]
  data.messageVersions[conversationId] = version
  save(data)
}
