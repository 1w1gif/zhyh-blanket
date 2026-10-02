"use client";

import { useState } from "react";
import { pickPaperColor } from "@wall/shared";
import { useStore } from "@/lib/store";

// 登录门:自己输入名字进入(不设固定名单,保护隐私),选择结果存在 localStorage
export function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useStore();
  const [draft, setDraft] = useState("");

  if (user) return <>{children}</>;

  const submit = () => {
    const name = draft.trim().slice(0, 12);
    if (!name) return;
    setUser(name);
  };

  return (
    <div className="login-mask">
      <div className="login-panel">
        <div className="login-title">张宇航的被窝</div>
        <div className="login-sub">✦ 报上名来,输入你的名字进被窝 ✦</div>
        <div className="login-inputrow">
          <input
            className="login-input"
            value={draft}
            maxLength={12}
            placeholder="写上你的名字(最多 12 字)"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
          <button
            className="login-go"
            style={{ background: pickPaperColor(draft) }}
            onClick={submit}
            disabled={!draft.trim()}
          >
            进被窝
          </button>
        </div>
        <div className="login-note">名字写错了?之后在顶栏点「换人」可以重新填</div>
      </div>
    </div>
  );
}
