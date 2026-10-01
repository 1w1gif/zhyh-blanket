import { NextResponse } from "next/server";
import { getPool, SCHEMA_SQL } from "@/lib/db";
import { Comment, Post } from "@wall/shared";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// 全量拉取(六人小站,数据量小,一次全拿最简单可靠)
export async function GET() {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "no database configured" }, { status: 503 });
  try {
    await pool.query(SCHEMA_SQL); // 首次访问自动建表
    const posts = (await pool.query("SELECT * FROM posts ORDER BY created_at DESC")).rows.map(
      rowToPost
    );
    const comments = (await pool.query("SELECT * FROM comments ORDER BY created_at ASC")).rows.map(
      rowToComment
    );
    return NextResponse.json({ posts, comments });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function rowToPost(r: Record<string, unknown>): Post {
  return {
    id: r.id as string,
    wall: r.wall as Post["wall"],
    author: r.author as string,
    title: r.title as string,
    content: r.content as string,
    color: r.color as string,
    x: r.x as number,
    y: r.y as number,
    rotation: r.rotation as number,
    visibility: r.visibility as Post["visibility"],
    devStatus: r.dev_status as Post["devStatus"],
    surveyUrl: (r.survey_url as string) ?? undefined,
    attachments: r.attachments as Post["attachments"],
    likes: r.likes as number,
    dislikes: r.dislikes as number,
    createdAt: Number(r.created_at),
  };
}

function rowToComment(r: Record<string, unknown>): Comment {
  return {
    id: r.id as string,
    postId: r.post_id as string,
    parentId: (r.parent_id as string) ?? null,
    author: r.author as string,
    content: r.content as string,
    attachment: (r.attachment as Comment["attachment"]) ?? undefined,
    likes: r.likes as number,
    dislikes: r.dislikes as number,
    createdAt: Number(r.created_at),
  };
}
