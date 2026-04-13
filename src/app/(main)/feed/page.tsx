"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { subscribeToPosts, subscribeToFriends, subscribeToChats } from "@/lib/firestore";
import { Post, Friend } from "@/types";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { HiGlobeAlt, HiUserCircle, HiSquares2X2 } from "react-icons/hi2";

type FeedFilter = "all" | "friends" | "global";

export default function FeedPage() {
  const user = useAuthStore((s) => s.user);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("all");

  useEffect(() => {
    const unsub = subscribeToPosts(setAllPosts);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFriends(user.uid, setFriends);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, (chats) => {
      setGroups(
        chats
          .filter((c) => c.type === "group")
          .map((c) => ({ id: c.id, name: c.name }))
      );
    });
    return () => unsub();
  }, [user]);

  const friendIds = useMemo(
    () => new Set(friends.map((f) => f.friendId)),
    [friends]
  );

  const visiblePosts = useMemo(() => {
    if (!user) return [];

    const accessiblePosts = allPosts.filter((post) => {
      if (post.authorId === user.uid) return true;
      if (post.visibility === "global") return true;
      if (friendIds.has(post.authorId)) return true;
      return false;
    });

    if (filter === "all") return accessiblePosts;
    if (filter === "friends") {
      return accessiblePosts.filter(
        (p) => p.visibility === "friends" || p.authorId === user.uid
      );
    }
    if (filter === "global") {
      return accessiblePosts.filter((p) => p.visibility === "global");
    }
    return accessiblePosts;
  }, [allPosts, user, friendIds, filter]);

  const friendOptions = friends.map((f) => ({
    username: f.friendUsername,
    uid: f.friendId,
  }));

  const filters: { key: FeedFilter; label: string; icon: typeof HiSquares2X2 }[] = [
    { key: "all", label: "All", icon: HiSquares2X2 },
    { key: "friends", label: "Friends", icon: HiUserCircle },
    { key: "global", label: "Global", icon: HiGlobeAlt },
  ];

  return (
    <div className="space-y-4">
      <CreatePost friends={friendOptions} groups={groups} />

      <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-blue-50">
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              filter === key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-600">No posts yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            {filter === "all"
              ? "Be the first to share something!"
              : filter === "friends"
              ? "No friends-only posts to show"
              : "No global posts to show"}
          </p>
        </div>
      ) : (
        visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
