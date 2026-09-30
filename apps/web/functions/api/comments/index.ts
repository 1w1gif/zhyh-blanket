// Cloudflare Pages Functions 版 API(POST/PATCH /api/comments)
import { getSql, SCHEMA_SQL } from "../../../lib/cfdb";
import { Comment } from "@wall/shared";

export const onRequestPost: PagesFunction = async ({ request }) => {
  const sql = getSql();
  if (!sql) return Response.json({ error: "no database configured" }, { status: 503 });
  try {
    await sql(SCHEMA_SQL);
    const c = (await request.json()) as Comment;
    await sql(
      `INSERT INTO comments (id, post_id, parent_id, author, content, attachment, likes, dislikes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        c.id, c.postId, c.parentId ?? null, c.author, c.content,
        c.attachment ? JSON.stringify(c.attachment) : null,
        c.likes ?? 0, c.dislikes ?? 0, c.createdAt,
      ]
    );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};

export const onRequestPatch: PagesFunction = async ({ request }) => {
  const sql = getSql();
  if (!sql) return Response.json({ error: "no database configured" }, { status: 503 });
  try {
    await sql(SCHEMA_SQL);
    const { id, dir } = (await request.json()) as { id: string; dir: 1 | -1 };
    const col = dir === 1 ? "likes" : "dislikes";
    await sql(`UPDATE comments SET ${col} = ${col} + 1 WHERE id = $1`, [id]);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
