"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Comment, MOCK_COMMENTS, MOCK_POSTS, Post, uid } from "@wall/shared";

interface Store {
  posts: Post[];
  comments: Comment[];
  me: string; // 当前用户名,未登录时为空串
  user: string | null;
  setUser: (name: string | null) => void;
  addPost: (p: Omit<Post, "id" | "createdAt" | "likes" | "dislikes">) => void;
  updatePost: (id: string, patch: Partial<Post>) => void;
  addComment: (postId: string, parentId: string | null, content: string) => void;
  voteComment: (commentId: string, dir: 1 | -1) => void;
  votePost: (postId: string, dir: 1 | -1) => void;
}

const Ctx = createContext<Store | null>(null);

const LS_KEY = "inspiration-wall-v1";
const LS_USER = "inspiration-wall-user";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUserState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setPosts(data.posts ?? []);
        setComments(data.comments ?? []);
      } else {
        setPosts(MOCK_POSTS);
        setComments(MOCK_COMMENTS);
      }
      setUserState(localStorage.getItem(LS_USER));
    } catch {
      setPosts(MOCK_POSTS);
      setComments(MOCK_COMMENTS);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ posts, comments }));
  }, [posts, comments, hydrated]);

  const setUser = useCallback((name: string | null) => {
    setUserState(name);
    if (name) localStorage.setItem(LS_USER, name);
    else localStorage.removeItem(LS_USER);
  }, []);

  const addPost: Store["addPost"] = useCallback((p) => {
    setPosts((prev) => [
      { ...p, id: uid(), likes: 0, dislikes: 0, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const updatePost: Store["updatePost"] = useCallback((id, patch) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const addComment: Store["addComment"] = useCallback(
    (postId, parentId, content) => {
      if (!user) return;
      setComments((prev) => [
        ...prev,
        {
          id: uid(),
          postId,
          parentId,
          author: user,
          content,
          createdAt: Date.now(),
          likes: 0,
          dislikes: 0,
        },
      ]);
    },
    [user]
  );

  const voteComment: Store["voteComment"] = useCallback((commentId, dir) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? dir === 1 ? { ...c, likes: c.likes + 1 } : { ...c, dislikes: c.dislikes + 1 }
          : c
      )
    );
  }, []);

  const votePost: Store["votePost"] = useCallback((postId, dir) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? dir === 1 ? { ...p, likes: p.likes + 1 } : { ...p, dislikes: p.dislikes + 1 }
          : p
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      posts,
      comments,
      me: user ?? "",
      user,
      setUser,
      addPost,
      updatePost,
      addComment,
      voteComment,
      votePost,
    }),
    [posts, comments, user, setUser, addPost, updatePost, addComment, voteComment, votePost]
  );

  if (!hydrated) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
