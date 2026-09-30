"use client";

import { MEMBERS, memberColor } from "@wall/shared";
import { useStore } from "@/lib/store";

// 登录门:六个人各选自己的名字进入,选择结果存在 localStorage
export function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useStore();

  if (user) return <>{children}</>;

  return (
    <div className="login-mask">
      <div className="login-panel">
        <div className="login-title">张宇航的被窝</div>
        <div className="login-sub">✦ 报上名来,选你的名字进被窝 ✦</div>
        <div className="login-grid">
          {MEMBERS.map((name, i) => (
            <button
              key={name}
              className="login-btn"
              style={{
                background: memberColor(name),
                transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1 + (i % 3))}deg)`,
                animationDelay: `${i * 0.07}s`,
              }}
              onClick={() => setUser(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="login-note">选错了?之后在顶栏点「换人」可以重新选</div>
      </div>
    </div>
  );
}
