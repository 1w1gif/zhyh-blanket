import { NextRequest, NextResponse } from "next/server";
import { getPool, SCHEMA_SQL } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// 更新帖子:支持可见性/状态/坐标/点赞等局部字段
export async function PATCH(req: NextRequest) {
  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "no database configured" }, { status: 503 });
  try {
    await pool.query(SCHEMA_SQL);
    const body = (await req.json()) as {
      id: string;
      patch: {
        visibility?: string;
        devStatus?: string;
        likes?: number;
        dislikes?: number;
        x?: number;
        y?: number;
      };
    };
    const { id, patch } = body;
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
    if (sets.length === 0) return NextResponse.json({ ok: true });
    vals.push(id);
    await pool.query(`UPDATE posts SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
