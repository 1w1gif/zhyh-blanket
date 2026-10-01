// Cloudflare Pages 构建入口
// next-on-pages 必须在 Next 应用目录(apps/web)内运行;而 Pages 后台的 Root directory
// 可能被配成仓库根或 apps/web,所以构建完把产物同时放到两处,后台配置怎么漂都能找到
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps", "web");

execSync("npx @cloudflare/next-on-pages@1", { cwd: web, stdio: "inherit" });

const source = join(web, ".vercel", "output", "static");
if (!existsSync(source)) {
  throw new Error("构建产物缺失:" + source);
}

// Root directory = apps/web 时产物已在位;再复制到仓库根,兼容 Root directory 留空的情况
const rootOutput = join(root, ".vercel", "output", "static");
rmSync(rootOutput, { recursive: true, force: true });
cpSync(source, rootOutput, { recursive: true });
console.log("产物就绪:", source);
console.log("产物就绪:", rootOutput);
