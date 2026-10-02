// 4201 被窝 · 组装 wrangler pages deploy 目录(手写 API 层,替代一切打包器)
// - .vercel/output/static → pages-deploy 根
// - functions/index.prerender-fallback.html → pages-deploy/index.html(入口页外壳)
// - functions/kanban.prerender-fallback.html → pages-deploy/kanban/index.html
// - 手写 _worker.js 接管 /api/*,数据走 Neon HTTP(连接串来自 wrangler.jsonc vars)
// - _routes.json:/api/* 走 Worker,其余全静态
// 用法: node scripts/assemble-deploy.cjs
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "apps", "web", "pages-deploy");
const base = path.join(root, "apps", "web", ".vercel", "output");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// 1. 静态前端
fs.cpSync(path.join(base, "static"), out, { recursive: true });

// 2. 入口页(纯客户端渲染外壳)
fs.copyFileSync(
  path.join(base, "functions", "index.prerender-fallback.html"),
  path.join(out, "index.html")
);
fs.mkdirSync(path.join(out, "kanban"), { recursive: true });
fs.copyFileSync(
  path.join(base, "functions", "kanban.prerender-fallback.html"),
  path.join(out, "kanban", "index.html")
);

// 3. 手写 API 层
fs.copyFileSync(
  path.join(__dirname, "worker.js"),
  path.join(out, "_worker.js")
);

// 4. 路由:/api/* 走 Worker,其余静态
fs.writeFileSync(
  path.join(out, "_routes.json"),
  JSON.stringify({ version: 1, include: ["/api/*"], exclude: [] }, null, 2)
);

console.log("assembled:", path.resolve(out));
console.log("entries:", fs.readdirSync(out).join(", "));
