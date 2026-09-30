// 服务端数据库访问(仅 API 路由使用)
// 没配 DATABASE_URL 时为 null,API 返回 503,前端自动降级到 localStorage
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pool: Pool | null;
}

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalThis.__pool) {
    globalThis.__pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalThis.__pool;
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
