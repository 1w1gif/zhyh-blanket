// 验证手写 Neon HTTP /sql 客户端(将来内嵌进 _worker.js 的同一份代码)
// 用法: node scripts/test-neon-http.cjs
const cs =
  "postgresql://neondb_owner:npg_HI5kd4osymre@ep-orange-sky-b3icvetz-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function sql(query, params = []) {
  const u = new URL(cs);
  const ep = "https://" + u.hostname + "/sql";
  const r = await fetch(ep, {
    method: "POST",
    headers: {
      "Neon-Connection-String": cs,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, params: params.map((p) => (p == null ? null : typeof p === "object" ? JSON.stringify(p) : String(p))) }),
  });
  if (!r.ok) throw new Error("HTTP " + r.status + ": " + (await r.text()));
  return r.json();
}

(async () => {
  const t1 = await sql("SELECT $1 AS v, 40+2 AS n", ["hello-neon"]);
  console.log("select:", JSON.stringify(t1));

  await sql(
    "CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, wall TEXT NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#FFE14D', x DOUBLE PRECISION NOT NULL DEFAULT 0, y DOUBLE PRECISION NOT NULL DEFAULT 0, rotation DOUBLE PRECISION NOT NULL DEFAULT 0, visibility TEXT NOT NULL DEFAULT 'published', dev_status TEXT NOT NULL DEFAULT 'none', survey_url TEXT, attachments JSONB NOT NULL DEFAULT '[]', likes INTEGER NOT NULL DEFAULT 0, dislikes INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL)"
  );
  await sql(
    "CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, parent_id TEXT, author TEXT NOT NULL, content TEXT NOT NULL, attachment JSONB, likes INTEGER NOT NULL DEFAULT 0, dislikes INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL)"
  );
  console.log("schema ok");

  const id = "zztest-" + Date.now();
  await sql(
    "INSERT INTO posts (id, wall, author, title, content, color, x, y, rotation, visibility, dev_status, survey_url, attachments, likes, dislikes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
    [id, "splash", "测试员", "直传测试贴", "body", "#FFE14D", 1, 2, 0, "published", "none", null, "[]", 0, 0, Date.now()]
  );
  const rows = await sql("SELECT id, author, title, attachments FROM posts WHERE id = $1", [id]);
  console.log("insert+select:", JSON.stringify(rows));

  await sql("DELETE FROM posts WHERE id = $1", [id]);
  const after = await sql("SELECT count(*)::text AS c FROM posts");
  console.log("after delete count:", JSON.stringify(after));
  console.log("ALL OK");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
