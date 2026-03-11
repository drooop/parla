import type { CachedConversation, CachedMessage } from "./cache"

const BASE = "/api/conversations"

export async function fetchConversations(tag?: string): Promise<CachedConversation[]> {
  const url = new URL(BASE, window.location.origin)
  if (tag) url.searchParams.set("tag", tag)

  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch conversations: ${resp.status}`)
  const rows = await resp.json()

  return rows.map((r: Record<string, unknown>) => ({
    id: r.id,
    title: r.title,
    tag: r.tag,
    msgCount: r.msg_count,
    version: r.version,
    updatedAt: r.updated_at,
  }))
}

export async function createConversation(tag: string): Promise<CachedConversation> {
  const resp = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  })
  if (!resp.ok) throw new Error(`Failed to create conversation: ${resp.status}`)
  const r = await resp.json()

  return {
    id: r.id,
    title: r.title,
    tag: r.tag,
    msgCount: r.msg_count,
    version: r.version,
    updatedAt: r.updated_at,
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const resp = await fetch(`${BASE}/${id}`, { method: "DELETE" })
  if (!resp.ok) throw new Error(`Failed to delete conversation: ${resp.status}`)
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const resp = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!resp.ok) throw new Error(`Failed to update title: ${resp.status}`)
}

export async function fetchMessages(
  conversationId: string,
  afterSeq?: number
): Promise<{ messages: CachedMessage[]; version: number }> {
  const url = new URL(`${BASE}/${conversationId}/messages`, window.location.origin)
  if (afterSeq !== undefined) url.searchParams.set("after_seq", String(afterSeq))

  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch messages: ${resp.status}`)
  const data = await resp.json()

  return {
    messages: data.messages.map((m: Record<string, unknown>) => ({
      role: m.role,
      content: m.content,
      lowConfidenceWords: m.low_confidence_words ?? undefined,
    })),
    version: data.version,
  }
}

export async function appendMessages(
  conversationId: string,
  messages: CachedMessage[]
): Promise<{ version: number; msgCount: number }> {
  const resp = await fetch(`${BASE}/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })
  if (!resp.ok) throw new Error(`Failed to save messages: ${resp.status}`)
  return resp.json()
}

export async function generateTitle(
  conversationId: string,
  firstMessage: string
): Promise<string> {
  const resp = await fetch(`${BASE}/${conversationId}/title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstMessage }),
  })
  if (!resp.ok) throw new Error(`Failed to generate title: ${resp.status}`)
  const data = await resp.json()
  return data.title
}
