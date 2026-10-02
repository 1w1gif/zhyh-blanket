// 张宇航的被窝 · API(Cloudflare Pages _worker.js 直写版)
// 接管 /api/*,数据存 Neon Postgres(经 HTTP /sql 端点,零依赖,免 WebSocket)
// DATABASE_URL 由 wrangler.jsonc vars 随部署带上
const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY, wall TEXT NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#FFE14D',
    x DOUBLE PRECISION NOT NULL DEFAULT 0, y DOUBLE PRECISION NOT NULL DEFAULT 0,
    rotation DOUBLE PRECISION NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'published',
    dev_status TEXT NOT NULL DEFAULT 'none', survey_url TEXT,
    attachments JSONB NOT NULL DEFAULT '[]', likes INTEGER NOT NULL DEFAULT 0,
    dislikes INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT, author TEXT NOT NULL,
    content TEXT NOT NULL, attachment JSONB, likes INTEGER NOT NULL DEFAULT 0,
    dislikes INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL)`,
]; // Neon /sql 端点一次只收一条语句,必须逐条执行

// ---------- Neon HTTP /sql 客户端(协议同 @neondatabase/serverless fetch 路径) ----------
// Pages 把 Secret 注入 fetch(request, env) 的 env;本地测试可走 globalThis
let CS = globalThis.DATABASE_URL || "";
let neonHost = "";
function initEnv(env) {
  if (env && env.DATABASE_URL) CS = env.DATABASE_URL;
  if (CS && !neonHost) {
    try {
      neonHost = new URL(CS).hostname;
    } catch {
      neonHost = "";
    }
  }
}

async function sql(query, params = []) {
  const r = await fetch("https://" + neonHost + "/sql", {
    method: "POST",
    headers: {
      "Neon-Connection-String": CS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      params: params.map((p) => (p == null || p === undefined ? null : typeof p === "object" ? JSON.stringify(p) : String(p))),
    }),
  });
  if (!r.ok) throw new Error("neon http " + r.status + ": " + (await r.text()));
  return (await r.json()).rows;
}

// ---------- 行 → 前端对象 ----------
function rowToPost(r) {
  return {
    id: r.id,
    wall: r.wall,
    author: r.author,
    title: r.title,
    content: r.content,
    color: r.color,
    x: Number(r.x),
    y: Number(r.y),
    rotation: Number(r.rotation),
    visibility: r.visibility,
    devStatus: r.dev_status,
    surveyUrl: r.survey_url ?? undefined,
    attachments: typeof r.attachments === "string" ? JSON.parse(r.attachments) : r.attachments,
    likes: Number(r.likes),
    dislikes: Number(r.dislikes),
    createdAt: Number(r.created_at),
  };
}

function rowToComment(r) {
  return {
    id: r.id,
    postId: r.post_id,
    parentId: r.parent_id ?? null,
    author: r.author,
    content: r.content,
    attachment: (typeof r.attachment === "string" ? JSON.parse(r.attachment) : r.attachment) ?? undefined,
    likes: Number(r.likes),
    dislikes: Number(r.dislikes),
    createdAt: Number(r.created_at),
  };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

async function ensureSchema() {
  for (const stmt of SCHEMA_SQL) await sql(stmt);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

// ---------- 路由处理 ----------
async function handleData() {
  await ensureSchema();
  const posts = (await sql("SELECT * FROM posts ORDER BY created_at DESC")).map(rowToPost);
  const comments = (await sql("SELECT * FROM comments ORDER BY created_at ASC")).map(rowToComment);
  return json({ posts, comments });
}

async function handlePostsPost(request) {
  await ensureSchema();
  const p = await readJson(request);
  await sql(
    `INSERT INTO posts (id, wall, author, title, content, color, x, y, rotation, visibility, dev_status, survey_url, attachments, likes, dislikes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      p.id, p.wall, p.author, p.title, p.content ?? "", p.color,
      p.x, p.y, p.rotation, p.visibility, p.devStatus,
      p.surveyUrl ?? null, p.attachments ?? [],
      p.likes ?? 0, p.dislikes ?? 0, p.createdAt,
    ]
  );
  return json({ ok: true });
}

const PATCH_COL = {
  visibility: "visibility",
  devStatus: "dev_status",
  likes: "likes",
  dislikes: "dislikes",
  x: "x",
  y: "y",
};

async function handlePostsPatch(request, id) {
  await ensureSchema();
  const body = await readJson(request);
  const patch = body.patch || {};
  const sets = [];
  const vals = [];
  for (const [k, col] of Object.entries(PATCH_COL)) {
    if (patch[k] !== undefined) {
      vals.push(patch[k]);
      sets.push(`${col} = $${vals.length}`);
    }
  }
  if (sets.length > 0) {
    vals.push(id);
    await sql(`UPDATE posts SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
  }
  return json({ ok: true });
}

async function handleCommentsPost(request) {
  await ensureSchema();
  const c = await readJson(request);
  await sql(
    `INSERT INTO comments (id, post_id, parent_id, author, content, attachment, likes, dislikes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      c.id, c.postId, c.parentId ?? null, c.author, c.content ?? "",
      c.attachment ?? null,
      c.likes ?? 0, c.dislikes ?? 0, c.createdAt,
    ]
  );
  return json({ ok: true });
}

async function handleCommentsPatch(request) {
  await ensureSchema();
  const { id, dir } = await readJson(request);
  const col = dir === 1 ? "likes" : "dislikes";
  await sql(`UPDATE comments SET ${col} = ${col} + 1 WHERE id = $1`, [id]);
  return json({ ok: true });
}

// ---------- Worker 入口 ----------
export default {
  async fetch(request, env) {
    initEnv(env);
    if (!CS || !neonHost) return json({ error: "no database configured" }, 503);

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    const m = request.method;

    try {
      if (path === "/api/data" && m === "GET") return await handleData();
      if (path === "/api/posts" && m === "POST") return await handlePostsPost(request);
      const postId = path.match(/^\/api\/posts\/([^/]+)$/);
      if (postId && m === "PATCH") return await handlePostsPatch(request, decodeURIComponent(postId[1]));
      if (path === "/api/comments" && m === "POST") return await handleCommentsPost(request);
      if (path === "/api/comments" && m === "PATCH") return await handleCommentsPatch(request);
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};
