import { NextRequest, NextResponse } from "next/server";
import { getPool, SCHEMA_SQL } from "@/lib/db";
import { Comment } from "@wall/shared";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// 新建评论
export async function POST(req: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "no database configured" }, { status: 503 });
  try {
    await pool.query(SCHEMA_SQL);
    const c = (await req.json()) as Comment;
    await pool.query(
      `INSERT INTO comments (id, post_id, parent_id, author, content, attachment, likes, dislikes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        c.id, c.postId, c.parentId ?? null, c.author, c.content,
        c.attachment ? JSON.stringify(c.attachment) : null,
        c.likes ?? 0, c.dislikes ?? 0, c.createdAt,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 评论点赞/点踩
export async function PATCH(req: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "no database configured" }, { status: 503 });
  try {
    await pool.query(SCHEMA_SQL);
    const { id, dir } = (await req.json()) as { id: string; dir: 1 | -1 };
    const col = dir === 1 ? "likes" : "dislikes";
    await pool.query(`UPDATE comments SET ${col} = ${col} + 1 WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
