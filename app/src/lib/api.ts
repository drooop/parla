const STT_URL = "http://localhost:8001"
const TTS_URL = "http://localhost:8002"
const LLM_URL = "http://localhost:11434"

export interface Word {
  word: string
  start: number
  end: number
  probability: number
}

export interface TranscribeResult {
  text: string
  language: string
  words: Word[]
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export async function transcribe(audioBlob: Blob): Promise<TranscribeResult> {
  const formData = new FormData()
  formData.append("file", audioBlob, "audio.webm")

  const resp = await fetch(`${STT_URL}/transcribe`, {
    method: "POST",
    body: formData,
  })

  if (!resp.ok) throw new Error(`STT failed: ${resp.status}`)
  return resp.json()
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const resp = await fetch(`${LLM_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3.5:9b",
      messages,
      stream: false,
      think: false,
      options: { num_ctx: 2048 },
    }),
  })

  if (!resp.ok) throw new Error(`LLM failed: ${resp.status}`)
  const data = await resp.json()
  return data.message.content
}

export async function synthesize(text: string): Promise<ArrayBuffer> {
  const resp = await fetch(`${TTS_URL}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`)
  return resp.arrayBuffer()
}
