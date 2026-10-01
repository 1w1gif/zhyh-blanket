import { NextRequest, NextResponse } from "next/server";
import { getPool, SCHEMA_SQL } from "@/lib/db";
import { Post } from "@wall/shared";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// 新建帖子
export async function POST(req: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "no database configured" }, { status: 503 });
  try {
    await pool.query(SCHEMA_SQL);
    const p = (await req.json()) as Post;
    await pool.query(
      `INSERT INTO posts (id, wall, author, title, content, color, x, y, rotation, visibility, dev_status, survey_url, attachments, likes, dislikes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        p.id, p.wall, p.author, p.title, p.content, p.color,
        p.x, p.y, p.rotation, p.visibility, p.devStatus,
        p.surveyUrl ?? null, JSON.stringify(p.attachments ?? []),
        p.likes ?? 0, p.dislikes ?? 0, p.createdAt,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
