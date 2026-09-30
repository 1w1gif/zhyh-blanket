"use client";

import Link from "next/link";
import { useState } from "react";
import { PostVisibility } from "@wall/shared";
import { StoreProvider, useStore } from "@/lib/store";
import { StatusTag } from "@/components/Bits";
import { LoginGate } from "@/components/LoginGate";

const COLUMNS: { key: PostVisibility; label: string }[] = [
  { key: "published", label: "📣 发布" },
  { key: "private", label: "🔒 自己可见" },
  { key: "banned", label: "🚫 封贴" },
];

function Kanban() {
  const { posts, updatePost, me } = useStore();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const mine = posts.filter((p) => p.author === me); // 只显示当前用户自己的发布
  const byCol = (v: PostVisibility) => mine.filter((p) => p.visibility === v);

  function drop(col: PostVisibility) {
    if (dragId) updatePost(dragId, { visibility: col });
    setDragId(null);
    setOverCol(null);
  }

  return (
    <LoginGate>
      <main className="kanban-page">
        <div className="kanban-title">📋 {me}的发布</div>
        <div className="board">
          {COLUMNS.map(({ key, label }) => (
            <section
              key={key}
              className="column"
              data-col={key}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(key);
              }}
              onDragLeave={() => setOverCol(null)}
              onDrop={() => drop(key)}
            >
              <div className="column-head">{label}</div>
              <div className={`column-body ${overCol === key ? "dragover" : ""}`}>
                {byCol(key).map((p) => (
                  <article
                    key={p.id}
                    className={`kan ${dragId === p.id ? "dragging" : ""}`}
                    style={{ "--paper-color": p.color } as React.CSSProperties}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <div className="kan-title">{p.title}</div>
                    <div className="row" style={{ gap: 6, fontSize: 11 }}>
                      <span className="kan-wall-badge">
                        {p.wall === "splash" ? "泼壁墙" : "灵感墙"}
                      </span>
                      <StatusTag status={p.devStatus} />
                      <span className="spacer" />
                      <span>👍 {p.likes}</span>
                    </div>
                  </article>
                ))}
                {byCol(key).length === 0 && (
                  <div style={{ fontSize: 12, opacity: 0.5, textAlign: "center", padding: 20 }}>
                    拖贴到这里
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <nav className="bottomnav">
          <Link href="/" className="navlink">🧱 墙</Link>
          <Link href="/kanban" className="navlink active">📋 我的发布</Link>
        </nav>
      </main>
    </LoginGate>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <Kanban />
    </StoreProvider>
  );
}
