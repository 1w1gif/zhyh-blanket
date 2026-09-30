"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Post, WallKind } from "@wall/shared";
import { useStore } from "@/lib/store";
import { StatusTag } from "./Bits";
import { FocusPanel } from "./FocusPanel";

// 无限画布:滚轮缩放 + 拖拽平移 + 触摸拖动
// 点击便利贴 → 画布聚焦放大到该贴 → 弹出评论面板
export function WallCanvas({ wall, onCompose }: { wall: WallKind; onCompose: () => void }) {
  const { posts } = useStore();
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);
  const moved = useRef(false);

  const visible = posts.filter(
    (p) => p.wall === wall && p.visibility === "published"
  );

  // 新发布的贴子做"啪贴"动画
  useEffect(() => {
    const newest = visible[0];
    if (newest && Date.now() - newest.createdAt < 4000) setFreshId(newest.id);
  }, [posts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setView((v) => {
      const k = Math.min(2.5, Math.max(0.3, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      // 以鼠标位置为锚点缩放
      return {
        k,
        x: mx - ((mx - v.x) / v.k) * k,
        y: my - ((my - v.y) / v.k) * k,
      };
    });
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    moved.current = false;
    if ((e.target as HTMLElement).closest(".note")) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
    setView((v) => ({ ...v, x: drag.current!.vx + dx, y: drag.current!.vy + dy }));
  }
  function onPointerUp() {
    drag.current = null;
    setDragging(false);
  }

  // 聚焦:把画布平移缩放,让目标贴子居中放大,然后打开评论面板
  function focusPost(p: Post) {
    if (moved.current) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const w = vp.clientWidth;
    const h = vp.clientHeight;
    setView({
      k: 1.35,
      x: w / 2 - (p.x + 120) * 1.35,
      y: h / 2 - (p.y + 110) * 1.35,
    });
    setTimeout(() => setFocusId(p.id), 280);
  }

  const focusPostData = visible.find((p) => p.id === focusId) ?? null;

  return (
    <>
      <div
        ref={viewportRef}
        className={`canvas-viewport ${dragging ? "dragging" : ""}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="canvas-world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
        >
          {/* 背景大字与星星装饰 */}
          <div className="deco-word" style={{ left: 60, top: -30, transform: "rotate(-6deg)" }}>
            {wall === "splash" ? "SPLASH!" : "IDEA!"}
          </div>
          <div className="deco-word" style={{ left: 900, top: 620, transform: "rotate(4deg)" }}>
            TAKE IT EASY
          </div>
          <div className="deco-star" style={{ left: 520, top: 60 }}>✦</div>
          <div className="deco-star" style={{ left: 120, top: 640, fontSize: 90 }}>✦</div>
          <div className="deco-star" style={{ left: 1050, top: 240, fontSize: 44, animationDirection: "reverse" }}>✺</div>

          {visible.map((p) => (
            <NoteCard
              key={p.id}
              post={p}
              fresh={p.id === freshId}
              onClick={() => focusPost(p)}
            />
          ))}
        </div>
      </div>

      {focusPostData && (
        <FocusPanel post={focusPostData} onClose={() => setFocusId(null)} />
      )}

      <button className="fab" onClick={onCompose} title="发布">+</button>
    </>
  );
}

function NoteCard({
  post,
  fresh,
  onClick,
}: {
  post: Post;
  fresh: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`note ${fresh ? "pinned-note" : ""}`}
      style={
        {
          "--paper-color": post.color,
          "--tilt": `${post.rotation}deg`,
          left: post.x,
          top: post.y,
        } as React.CSSProperties
      }
      onClick={onClick}
    >
      <div className="note-title">{post.title}</div>
      <div className="note-body">{post.content}</div>
      {post.surveyUrl && <span className="survey-btn">📋 报表</span>}
      <div className="note-meta">
        <span>@{post.author}</span>
        <span className="row" style={{ gap: 4 }}>
          <StatusTag status={post.devStatus} />
          👍{post.likes}
        </span>
      </div>
    </div>
  );
}
