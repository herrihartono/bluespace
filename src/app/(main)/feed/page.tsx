"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { subscribeToPosts, subscribeToFriends, subscribeToChats } from "@/lib/firestore";
import { Post, Friend, Chat } from "@/types";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";

export default function FeedPage() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const unsub = subscribeToPosts(setPosts);
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

  const friendOptions = friends.map((f) => ({
    username: f.friendUsername,
    uid: f.friendId,
  }));

  return (
    <div className="space-y-4">
      <CreatePost friends={friendOptions} groups={groups} />

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-600">No posts yet</h3>
          <p className="text-gray-400 text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
