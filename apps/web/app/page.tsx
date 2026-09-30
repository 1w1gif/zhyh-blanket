"use client";

import Link from "next/link";
import { useState } from "react";
import { WallKind } from "@wall/shared";
import { StoreProvider, useStore } from "@/lib/store";
import { WallCanvas } from "@/components/WallCanvas";
import { Composer } from "@/components/Composer";
import { LoginGate } from "@/components/LoginGate";

const MARQUEE_TEXT =
  "✦ 泼壁宣言:有想法就贴上来 ✦ 灵感不落地就烂在脑子里 ✦ 校园交易、拼车、食堂热力图正在开发 ✦ TAKE IT EASY ✦ 欢迎来到张宇航的被窝 ✦ ";

function TopBar() {
  const { user, setUser } = useStore();
  return (
    <header className="topbar">
      <div className="logo">张宇航的被窝</div>
      <div className="marquee">
        <span>{MARQUEE_TEXT.repeat(4)}</span>
      </div>
      {user && (
        <button className="user-chip" onClick={() => setUser(null)} title="切换用户">
          🧸 {user} · 换人
        </button>
      )}
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="bottomnav">
      <Link href="/" className="navlink active">🧱 墙</Link>
      <Link href="/kanban" className="navlink">📋 我的发布</Link>
    </nav>
  );
}

function WallPage() {
  const [wall, setWall] = useState<WallKind>("splash");
  const [composing, setComposing] = useState(false);

  return (
    <LoginGate>
      <main>
        <TopBar />

        <div className="wall-tabs">
          <button
            className={`tab-btn ${wall === "splash" ? "active" : ""}`}
            onClick={() => setWall("splash")}
          >
            🧱 泼壁墙
          </button>
          <button
            className={`tab-btn ${wall === "idea" ? "active idea-active" : ""}`}
            onClick={() => setWall("idea")}
          >
            💡 灵感墙
          </button>
        </div>

        <WallCanvas wall={wall} onCompose={() => setComposing(true)} />
        {composing && <Composer wall={wall} onClose={() => setComposing(false)} />}

        <BottomNav />
      </main>
    </LoginGate>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <WallPage />
    </StoreProvider>
  );
}
