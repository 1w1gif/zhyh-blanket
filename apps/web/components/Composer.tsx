"use client";

import { FormEvent, useState } from "react";
import { DevStatus, PAPER_COLORS, PostVisibility, WallKind } from "@wall/shared";
import { useStore } from "@/lib/store";

export function Composer({
  wall,
  onClose,
}: {
  wall: WallKind;
  onClose: () => void;
}) {
  const { addPost, me } = useStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(PAPER_COLORS[Math.floor(Math.random() * PAPER_COLORS.length)]);
  const [surveyUrl, setSurveyUrl] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("published");
  const [devStatus, setDevStatus] = useState<DevStatus>("none");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // 新贴随机落在当前视野中央附近
    addPost({
      wall,
      author: me,
      title: title.trim(),
      content: content.trim(),
      color,
      x: 300 + Math.random() * 260,
      y: 240 + Math.random() * 200,
      rotation: (Math.random() - 0.5) * 8,
      visibility,
      devStatus,
      surveyUrl: surveyUrl.trim() || undefined,
      attachments: [],
    });
    onClose();
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <form className="panel" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{wall === "splash" ? "泼一张!" : "发布灵感"}</h2>

        <div className="field">
          <label>标题 *</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={wall === "splash" ? "喊一嗓子…" : "我想做…"}
            maxLength={30}
          />
        </div>

        <div className="field">
          <label>正文</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="多说两句,让别人看懂你的想法"
            maxLength={500}
          />
        </div>

        <div className="field">
          <label>贴纸颜色</label>
          <div className="color-row">
            {PAPER_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-dot ${c === color ? "sel" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`选择颜色 ${c}`}
              />
            ))}
          </div>
        </div>

        {wall === "idea" && (
          <>
            <div className="field">
              <label>报表 / 问卷链接(可选,别人点击「填报表」自动跳转)</label>
              <input
                value={surveyUrl}
                onChange={(e) => setSurveyUrl(e.target.value)}
                placeholder="https://wj.qq.com/…"
                type="url"
              />
            </div>
            <div className="field">
              <label>开发状态</label>
              <div className="row">
                {(["none", "developing", "launched"] as DevStatus[]).map((s) => (
                  <label key={s} className="row" style={{ gap: 4, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="dev"
                      checked={devStatus === s}
                      onChange={() => setDevStatus(s)}
                    />
                    {s === "none" ? "只是想法" : s === "developing" ? "正在开发" : "已经发布"}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="field">
          <label>可见性</label>
          <div className="row">
            {([
              ["published", "发布(所有人可见)"],
              ["private", "仅自己可见"],
            ] as [PostVisibility, string][]).map(([v, label]) => (
              <label key={v} className="row" style={{ gap: 4, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="vis"
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button className="btn-main" type="submit">
          {wall === "splash" ? "啪!贴上去" : "发布到灵感墙"}
        </button>
      </form>
    </div>
  );
}
