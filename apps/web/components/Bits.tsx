"use client";

import { Attachment, DevStatus } from "@wall/shared";

export function StatusTag({ status }: { status: DevStatus }) {
  if (status === "none") return null;
  if (status === "developing")
    return <span className="tag tag-developing">正在开发</span>;
  return <span className="tag tag-launched">已经发布!</span>;
}

// 附件预览:mock 阶段用撞色占位色块,未来换成真实文件 URL
export function AttachPreview({ a, onClick }: { a: Attachment; onClick?: () => void }) {
  return (
    <span
      className={`attach ${a.kind === "file" ? "file" : ""}`}
      onClick={onClick}
      title={`预览 ${a.name}`}
    >
      <span className="thumb" />
      <span className="name">{a.kind === "image" ? "🖼 " : a.kind === "audio" ? "🎵 " : "📄 "}{a.name}</span>
    </span>
  );
}
