"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Comment, MOCK_COMMENTS, MOCK_POSTS, Post, uid } from "@wall/shared";

interface Store {
  posts: Post[];
  comments: Comment[];
  me: string;
  user: string | null;
  setUser: (name: string | null) => void;
  addPost: (p: Omit<Post, "id" | "createdAt" | "likes" | "dislikes">) => void;
  updatePost: (id: string, patch: Partial<Post>) => void;
  addComment: (postId: string, parentId: string | null, content: string) => void;
  voteComment: (commentId: string, dir: 1 | -1) => void;
  votePost: (postId: string, dir: 1 | -1) => void;
  synced: boolean; // true = 云端共享数据;false = 本机 localStorage 模式
}

const Ctx = createContext<Store | null>(null);

const LS_KEY = "inspiration-wall-v1";
const LS_USER = "inspiration-wall-user";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUserState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 启动:优先从云端拉数据,失败则降级 localStorage + mock
  useEffect(() => {
    setUserState(localStorage.getItem(LS_USER));
    (async () => {
      try {
        const res = await fetch("/api/data", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setPosts(data.posts);
        setComments(data.comments);
        setSynced(true);
      } catch {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) {
            const d = JSON.parse(raw);
            setPosts(d.posts?.length ? d.posts : MOCK_POSTS);
            setComments(d.comments ?? MOCK_COMMENTS);
          } else {
            setPosts(MOCK_POSTS);
            setComments(MOCK_COMMENTS);
          }
        } catch {
          setPosts(MOCK_POSTS);
          setComments(MOCK_COMMENTS);
        }
      }
      setHydrated(true);
    })();
  }, []);

  // 云端模式:每 4 秒轮询别人的新贴/新评论
  useEffect(() => {
    if (!synced) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/data", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setPosts(data.posts);
        setComments(data.comments);
      } catch {
        /* 网络抖动时保留现有数据 */
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [synced]);

  // 本地模式才持久化
  useEffect(() => {
    if (!hydrated || synced) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ posts, comments }));
  }, [posts, comments, hydrated, synced]);

  const setUser = useCallback((name: string | null) => {
    setUserState(name);
    if (name) localStorage.setItem(LS_USER, name);
    else localStorage.removeItem(LS_USER);
  }, []);

  const addPost: Store["addPost"] = useCallback((p) => {
    const post: Post = { ...p, id: uid(), likes: 0, dislikes: 0, createdAt: Date.now() };
    setPosts((prev) => [post, ...prev]);
    if (synced) {
      fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      }).catch(() => {});
    }
  }, [synced]);

  const updatePost: Store["updatePost"] = useCallback((id, patch) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (synced) {
      fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      }).catch(() => {});
    }
  }, [synced]);

  const addComment: Store["addComment"] = useCallback(
    (postId, parentId, content) => {
      if (!user) return;
      const c: Comment = {
        id: uid(),
        postId,
        parentId,
        author: user,
        content,
        createdAt: Date.now(),
        likes: 0,
        dislikes: 0,
      };
      setComments((prev) => [...prev, c]);
      if (synced) {
        fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        }).catch(() => {});
      }
    },
    [user, synced]
  );

  const voteComment: Store["voteComment"] = useCallback((commentId, dir) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? dir === 1 ? { ...c, likes: c.likes + 1 } : { ...c, dislikes: c.dislikes + 1 }
          : c
      )
    );
    if (synced) {
      fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commentId, dir }),
      }).catch(() => {});
    }
  }, [synced]);

  const votePost: Store["votePost"] = useCallback((postId, dir) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? dir === 1 ? { ...p, likes: p.likes + 1 } : { ...p, dislikes: p.dislikes + 1 }
          : p
      )
    );
    if (synced) {
      fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, patch: dir === 1 ? { likes: 1 } : { dislikes: 1 } }),
      }).catch(() => {});
    }
  }, [synced]);

  const value = useMemo(
    () => ({ posts, comments, me: user ?? "", user, setUser, addPost, updatePost, addComment, voteComment, votePost, synced }),
    [posts, comments, user, setUser, addPost, updatePost, addComment, voteComment, votePost, synced]
  );

  if (!hydrated) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
