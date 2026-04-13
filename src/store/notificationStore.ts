"use client";

import { create } from "zustand";

interface NotificationState {
  unreadChats: number;
  pendingRequests: number;
  unreadPosts: number;
  setUnreadChats: (n: number) => void;
  setPendingRequests: (n: number) => void;
  setUnreadPosts: (n: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadChats: 0,
  pendingRequests: 0,
  unreadPosts: 0,
  setUnreadChats: (n) => set({ unreadChats: n }),
  setPendingRequests: (n) => set({ pendingRequests: n }),
  setUnreadPosts: (n) => set({ unreadPosts: n }),
}));
