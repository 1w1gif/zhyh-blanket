// Cloudflare Pages Functions 版 API(GET /api/data)
import { getSql, SCHEMA_SQL } from "../../lib/cfdb";

import { Comment, Post } from "@wall/shared";

export const onRequestGet: PagesFunction = async () => {
  const sql = getSql();
  if (!sql) return Response.json({ error: "no database configured" }, { status: 503 });
  try {
    await sql(SCHEMA_SQL);
    const postRows = await sql("SELECT * FROM posts ORDER BY created_at DESC");
    const commentRows = await sql("SELECT * FROM comments ORDER BY created_at ASC");
    const posts = (postRows as Record<string, unknown>[]).map(rowToPost);
    const comments = (commentRows as Record<string, unknown>[]).map(rowToComment);
    return Response.json({ posts, comments });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};

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
