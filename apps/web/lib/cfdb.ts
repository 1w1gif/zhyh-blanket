// Cloudflare Pages Functions 共用的数据库助手
// 通过 Neon 的 HTTP 无服务器驱动直连 Postgres(免 WebSocket,CF Workers 友好)
import { neon } from "@neondatabase/serverless";

type Sql = (query: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

declare global {
  // eslint-disable-next-line no-var
  var __sql: Sql | undefined;
}

export function getSql(): Sql | null {
  const url =
    (globalThis as unknown as Record<string, string | undefined>).DATABASE_URL ??
    process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalThis.__sql) {
    // neon() 既支持模板串也支持 (string, params) 调用,这里统一用后者
    globalThis.__sql = neon(url) as unknown as Sql;
  }
  return globalThis.__sql;
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  wall TEXT NOT NULL,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#FFE14D',
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'published',
  dev_status TEXT NOT NULL DEFAULT 'none',
  survey_url TEXT,
  attachments JSONB NOT NULL DEFAULT '[]',
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  parent_id TEXT,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment JSONB,
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);
`;
