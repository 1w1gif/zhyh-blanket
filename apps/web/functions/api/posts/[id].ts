// Cloudflare Pages Functions 版 API(PATCH /api/posts/[id])
import { getSql, SCHEMA_SQL } from "../../../lib/cfdb";

interface Ctx {
  request: Request;
  params: { id: string };
}

export const onRequestPatch: PagesFunction<Ctx> = async ({ request, params }) => {
  const sql = getSql();
  if (!sql) return Response.json({ error: "no database configured" }, { status: 503 });
  try {
    await sql(SCHEMA_SQL);
    const body = (await request.json()) as {
      patch: {
        visibility?: string;
        devStatus?: string;
        likes?: number;
        dislikes?: number;
        x?: number;
        y?: number;
      };
    };
    const { patch } = body;
    const sets: string[] = [];
    const vals: unknown[] = [];
    const map: Record<string, string> = {
      visibility: "visibility",
      devStatus: "dev_status",
      likes: "likes",
      dislikes: "dislikes",
      x: "x",
      y: "y",
    };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k as keyof typeof patch] !== undefined) {
        vals.push(patch[k as keyof typeof patch]);
        sets.push(`${col} = $${vals.length}`);
      }
    }
    if (sets.length > 0) {
      vals.push(params.id);
      await sql(`UPDATE posts SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
