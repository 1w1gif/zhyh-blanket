// 本地冒烟:_worker.js 的业务处理函数(不经过 wrangler,直接模拟 fetch 调用)
// globalThis.DATABASE_URL 模拟 wrangler vars 注入
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

process.env.NODE_ENV = "test";
globalThis.DATABASE_URL =
  "postgresql://neondb_owner:npg_HI5kd4osymre@ep-orange-sky-b3icvetz-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

(async () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "..", "apps", "web", "pages-deploy", "_worker.js"),
    "utf8"
  );
  const mod = await import(
    "data:text/javascript;base64," + Buffer.from(src, "utf8").toString("base64")
  );
  const worker = mod.default;

  const mk = (method, pathname, body) =>
    new Request("https://example.com" + pathname, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

  // 1. GET /api/data
  let r = await worker.fetch(mk("GET", "/api/data"));
  let d = await r.json();
  console.log("GET /api/data:", r.status, "posts:", d.posts?.length, "comments:", d.comments?.length);
  if (r.status !== 200) throw new Error("data failed");

  // 2. POST /api/posts(测试贴)
  const testPost = {
    id: "zzsmoke-" + Date.now(),
    wall: "splash",
    author: "冒烟测试",
    title: "worker 冒烟测试",
    content: "本地模拟",
    color: "#FF5DA2",
    x: 0,
    y: 0,
    rotation: 0,
    visibility: "published",
    devStatus: "none",
    attachments: [],
    likes: 0,
    dislikes: 0,
    createdAt: Date.now(),
  };
  r = await worker.fetch(mk("POST", "/api/posts", testPost));
  console.log("POST /api/posts:", r.status, await r.json());

  // 3. PATCH /api/posts/[id]
  r = await worker.fetch(mk("PATCH", "/api/posts/" + testPost.id, { id: testPost.id, patch: { likes: 1 } }));
  console.log("PATCH /api/posts/[id]:", r.status, await r.json());

  // 4. POST /api/comments
  const testComment = {
    id: "zzsmokec-" + Date.now(),
    postId: testPost.id,
    parentId: null,
    author: "冒烟测试",
    content: "评论冒烟",
    createdAt: Date.now(),
    likes: 0,
    dislikes: 0,
  };
  r = await worker.fetch(mk("POST", "/api/comments", testComment));
  console.log("POST /api/comments:", r.status, await r.json());

  // 5. PATCH /api/comments(点赞)
  r = await worker.fetch(mk("PATCH", "/api/comments", { id: testComment.id, dir: 1 }));
  console.log("PATCH /api/comments:", r.status, await r.json());

  // 6. 校验落地数据
  r = await worker.fetch(mk("GET", "/api/data"));
  d = await r.json();
  const p = d.posts.find((x) => x.id === testPost.id);
  const c = d.comments.find((x) => x.id === testComment.id);
  console.log("verify post:", JSON.stringify(p && { likes: p.likes, author: p.author, attachments: p.attachments }));
  console.log("verify comment:", JSON.stringify(c && { likes: c.likes, content: c.content }));

  // 7. 清理测试数据
  // (worker 没有删除端点,直接走 /sql 清)
  const u = new URL(globalThis.DATABASE_URL);
  const clean = await fetch("https://" + u.hostname + "/sql", {
    method: "POST",
    headers: { "Neon-Connection-String": globalThis.DATABASE_URL, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "DELETE FROM comments WHERE id = $1; DELETE FROM posts WHERE id = $2",
      params: [testComment.id, testPost.id],
    }),
  });
  console.log("cleanup:", clean.status);

  if (!p || p.likes !== 1) throw new Error("post patch not persisted");
  if (!c || c.likes !== 1) throw new Error("comment patch not persisted");
  console.log("SMOKE OK");
})().catch((e) => {
  console.error("SMOKE FAIL:", e.message);
  process.exit(1);
});
