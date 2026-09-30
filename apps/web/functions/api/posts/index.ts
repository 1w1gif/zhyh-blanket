// Cloudflare Pages Functions 版 API(POST /api/posts)
import { getSql, SCHEMA_SQL } from "../../../lib/cfdb";
import { Post } from "@wall/shared";

export const onRequestPost: PagesFunction = async ({ request }) => {
  const sql = getSql();
  if (!sql) return Response.json({ error: "no database configured" }, { status: 503 });
  try {
    await sql(SCHEMA_SQL);
    const p = (await request.json()) as Post;
    await sql(
      `INSERT INTO posts (id, wall, author, title, content, color, x, y, rotation, visibility, dev_status, survey_url, attachments, likes, dislikes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        p.id, p.wall, p.author, p.title, p.content, p.color,
        p.x, p.y, p.rotation, p.visibility, p.devStatus,
        p.surveyUrl ?? null, JSON.stringify(p.attachments ?? []),
        p.likes ?? 0, p.dislikes ?? 0, p.createdAt,
      ]
    );
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
