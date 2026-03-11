import { NextRequest, NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

const LLM_URL = process.env.LLM_URL || "http://localhost:11434"

// POST /api/conversations/:id/title/generate
// Generates a title using local LLM based on first user message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { firstMessage } = await req.json()

  if (!firstMessage) {
    return NextResponse.json({ error: "firstMessage required" }, { status: 400 })
  }

  // Ask local LLM to generate a short title
  const llmResp = await fetch(`${LLM_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3.5:9b",
      messages: [
        {
          role: "system",
          content: "Generate a short title (max 6 words, in English) for this conversation based on the user's first message. Reply with ONLY the title, nothing else.",
        },
        { role: "user", content: firstMessage },
      ],
      stream: false,
      think: false,
      options: { num_ctx: 256 },
    }),
  })

  if (!llmResp.ok) {
    // Fallback: truncate first message
    const fallbackTitle = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "")
    await queryOne(
      "UPDATE conversations SET title = $1, updated_at = now() WHERE id = $2 RETURNING title",
      [fallbackTitle, id]
    )
    return NextResponse.json({ title: fallbackTitle })
  }

  const data = await llmResp.json()
  const title = (data.message?.content || firstMessage.slice(0, 40)).trim().slice(0, 200)

  await queryOne(
    "UPDATE conversations SET title = $1, updated_at = now() WHERE id = $2 RETURNING title",
    [title, id]
  )

  return NextResponse.json({ title })
}
