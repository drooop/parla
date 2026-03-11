import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/db"

interface ConversationRow {
  id: string
  title: string | null
  tag: string
  msg_count: number
  version: number
  created_at: string
  updated_at: string
}

// GET /api/conversations?tag=free-talk&since_version=5
export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag")
  const sinceVersion = req.nextUrl.searchParams.get("since_version")

  let sql = "SELECT id, title, tag, msg_count, version, created_at, updated_at FROM conversations"
  const params: unknown[] = []
  const conditions: string[] = []

  if (tag) {
    conditions.push(`tag = $${params.length + 1}`)
    params.push(tag)
  }

  if (sinceVersion) {
    conditions.push(`version > $${params.length + 1}`)
    params.push(Number(sinceVersion))
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ")
  }

  sql += " ORDER BY updated_at DESC"

  const rows = await query<ConversationRow>(sql, params)
  return NextResponse.json(rows)
}

// POST /api/conversations { tag: "free-talk" }
export async function POST(req: NextRequest) {
  const { tag } = await req.json()

  if (!tag) {
    return NextResponse.json({ error: "tag is required" }, { status: 400 })
  }

  const row = await queryOne<ConversationRow>(
    "INSERT INTO conversations (tag) VALUES ($1) RETURNING id, title, tag, msg_count, version, created_at, updated_at",
    [tag]
  )

  return NextResponse.json(row, { status: 201 })
}
