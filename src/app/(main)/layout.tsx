"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { subscribeToChats, subscribeToFriendRequests, subscribeToPosts } from "@/lib/firestore";
import { Chat, FriendRequest, Post } from "@/types";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

function isUnreadChat(chat: Chat, userId: string): boolean {
  const lastRead = chat.lastReadAt?.[userId] || 0;
  return chat.updatedAt > lastRead && chat.lastMessageBy !== userId;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const { setUnreadChats, setPendingRequests, setUnreadPosts } = useNotificationStore();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const unsubChats = subscribeToChats(user.uid, (chats: Chat[]) => {
      const count = chats.filter((c) => isUnreadChat(c, user.uid)).length;
      setUnreadChats(count);
    });

    const unsubRequests = subscribeToFriendRequests(user.uid, (reqs: FriendRequest[]) => {
      setPendingRequests(reqs.length);
    });

    const unsubPosts = subscribeToPosts((posts: Post[]) => {
      try {
        const lastSeen = parseInt(localStorage.getItem("lastSeenFeed") || "0", 10);
        const count = posts.filter(
          (p) =>
            p.createdAt > lastSeen &&
            p.authorId !== user.uid &&
            (p.tags?.includes(user.username) || p.groupTags?.length > 0)
        ).length;
        setUnreadPosts(count);
      } catch {
        setUnreadPosts(0);
      }
    });

    return () => {
      unsubChats();
      unsubRequests();
      unsubPosts();
    };
  }, [user, setUnreadChats, setPendingRequests, setUnreadPosts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f0f5ff]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
