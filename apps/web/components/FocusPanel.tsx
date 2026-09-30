"use client";

import { useState } from "react";
import { Comment, Post } from "@wall/shared";
import { useStore } from "@/lib/store";
import { AttachPreview, StatusTag } from "./Bits";

export function FocusPanel({ post, onClose }: { post: Post; onClose: () => void }) {
  const { comments, addComment, voteComment, votePost, updatePost } = useStore();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [text, setText] = useState("");

  const list = comments
    .filter((c) => c.postId === post.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  const roots = list.filter((c) => c.parentId === null);
  const repliesOf = (id: string) => list.filter((c) => c.parentId === id);

  function send(parentId: string | null) {
    if (!text.trim()) return;
    addComment(post.id, parentId, text.trim());
    setText("");
    setReplyTo(null);
  }

  function toggleBan() {
    updatePost(post.id, {
      visibility: post.visibility === "banned" ? "published" : "banned",
    });
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>聚焦讨论</h2>
          <div className="spacer" />
          <button className="vote-btn" onClick={toggleBan}>
            {post.visibility === "banned" ? "解除封贴" : "封贴"}
          </button>
          <button className="vote-btn" onClick={onClose}>✕ 关闭</button>
        </div>

        {/* 聚焦大卡 */}
        <div className="focus-card" style={{ "--paper-color": post.color } as React.CSSProperties}>
          <div className="row" style={{ marginBottom: 6 }}>
            <StatusTag status={post.devStatus} />
            <b style={{ fontSize: 12 }}>{post.author}</b>
          </div>
          <div className="note-title" style={{ fontSize: 18 }}>{post.title}</div>
          <div className="comment-body" style={{ fontSize: 14 }}>{post.content}</div>

          {post.attachments.length > 0 && (
            <div>
              {post.attachments.map((a) => (
                <AttachPreview key={a.id} a={a} />
              ))}
            </div>
          )}

          {post.surveyUrl && (
            <a className="survey-btn" href={post.surveyUrl} target="_blank" rel="noreferrer">
              📋 填写报表 →
            </a>
          )}

          <div className="row" style={{ marginTop: 10 }}>
            <button className="vote-btn" onClick={() => votePost(post.id, 1)}>
              👍 {post.likes}
            </button>
            <button className="vote-btn" onClick={() => votePost(post.id, -1)}>
              👎 {post.dislikes}
            </button>
          </div>
        </div>

        {/* 评论区:最多二级 */}
        <div style={{ marginTop: 16 }}>
          {roots.map((c) => (
            <div key={c.id}>
              <CommentItem c={c} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} />
              {repliesOf(c.id).map((r) => (
                <CommentItem key={r.id} c={r} reply />
              ))}
              {replyTo === c.id && (
                <div className="reply-box">
                  <input
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send(c.id)}
                    placeholder={`回复 @${c.author}…`}
                  />
                  <button onClick={() => send(c.id)}>发送</button>
                </div>
              )}
            </div>
          ))}

          {/* 新主评论 */}
          <div className="reply-box" style={{ marginTop: 8 }}>
            <input
              value={replyTo === null ? text : ""}
              onChange={(e) => replyTo === null && setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(null)}
              placeholder="说点什么…(评论支持附件,后续版本开放上传)"
            />
            <button onClick={() => send(null)}>评论</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  c,
  reply = false,
  onReply,
}: {
  c: Comment;
  reply?: boolean;
  onReply?: () => void;
}) {
  const { voteComment } = useStore();
  return (
    <div className={`comment ${reply ? "reply" : ""}`}>
      <div className="comment-head">
        <span className="avatar">{c.author[0]}</span>
        {c.author}
      </div>
      <div className="comment-body">{c.content}</div>
      {c.attachment && <AttachPreview a={c.attachment} />}
      <div className="comment-actions">
        <button className="vote-btn" onClick={() => voteComment(c.id, 1)}>👍 {c.likes}</button>
        <button className="vote-btn" onClick={() => voteComment(c.id, -1)}>👎 {c.dislikes}</button>
        {!reply && (
          <button className="vote-btn" onClick={onReply}>↩ 回复</button>
        )}
      </div>
    </div>
  );
}
