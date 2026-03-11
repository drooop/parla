import { NextRequest, NextResponse } from "next/server"
import { queryOne, query } from "@/lib/db"

// GET /api/conversations/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const row = await queryOne(
    "SELECT id, title, tag, msg_count, version, created_at, updated_at FROM conversations WHERE id = $1",
    [id]
  )

  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  return NextResponse.json(row)
}

// PATCH /api/conversations/:id { title: "..." }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { title } = await req.json()

  const row = await queryOne(
    "UPDATE conversations SET title = $1, updated_at = now() WHERE id = $2 RETURNING id, title, tag, msg_count, version, created_at, updated_at",
    [title, id]
  )

  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  return NextResponse.json(row)
}

// DELETE /api/conversations/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await query("DELETE FROM conversations WHERE id = $1", [id])
  return NextResponse.json({ ok: true })
}
