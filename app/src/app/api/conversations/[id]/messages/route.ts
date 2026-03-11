import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, pool } from "@/lib/db"

interface MessageRow {
  id: string
  conversation_id: string
  seq: number
  role: string
  content: string
  low_confidence_words: string[] | null
  created_at: string
}

// GET /api/conversations/:id/messages?after_seq=10
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const afterSeq = req.nextUrl.searchParams.get("after_seq")

  let sql = "SELECT id, conversation_id, seq, role, content, low_confidence_words, created_at FROM messages WHERE conversation_id = $1"
  const sqlParams: unknown[] = [id]

  if (afterSeq) {
    sql += ` AND seq > $2`
    sqlParams.push(Number(afterSeq))
  }

  sql += " ORDER BY seq ASC"

  const rows = await query<MessageRow>(sql, sqlParams)

  // Also return current conversation version for sync
  const conv = await queryOne<{ version: number }>(
    "SELECT version FROM conversations WHERE id = $1",
    [id]
  )

  return NextResponse.json({
    messages: rows,
    version: conv?.version ?? 0,
  })
}

// POST /api/conversations/:id/messages { messages: [...] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { messages } = await req.json()

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Get current max seq
    const seqResult = await client.query(
      "SELECT COALESCE(MAX(seq), 0) as max_seq FROM messages WHERE conversation_id = $1",
      [id]
    )
    let seq = seqResult.rows[0].max_seq as number

    for (const msg of messages) {
      seq++
      await client.query(
        "INSERT INTO messages (conversation_id, seq, role, content, low_confidence_words) VALUES ($1, $2, $3, $4, $5)",
        [id, seq, msg.role, msg.content, msg.lowConfidenceWords ? JSON.stringify(msg.lowConfidenceWords) : null]
      )
    }

    // Update conversation version and msg_count
    const convResult = await client.query(
      "UPDATE conversations SET version = version + 1, msg_count = $1, updated_at = now() WHERE id = $2 RETURNING version",
      [seq, id]
    )

    await client.query("COMMIT")

    return NextResponse.json({
      version: convResult.rows[0].version,
      msgCount: seq,
    })
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
