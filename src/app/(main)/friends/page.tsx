"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  subscribeToFriendRequests,
  subscribeToFriends,
  respondToFriendRequest,
  addFriend,
  removeFriendBidirectional,
} from "@/lib/firestore";
import { FriendRequest, Friend } from "@/types";
import { HiCheck, HiXMark, HiUserMinus, HiChatBubbleLeftEllipsis, HiMagnifyingGlass, HiUserPlus } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { findPrivateChat, createChat } from "@/lib/firestore";

export default function FriendsPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeToFriendRequests(user.uid, setRequests);
    const unsub2 = subscribeToFriends(user.uid, setFriends);
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  const handleAccept = async (req: FriendRequest) => {
    if (!user) return;
    try {
      await respondToFriendRequest(req.id, "accepted");
      const now = Date.now();
      await addFriend(user.uid, {
        odId: req.fromId,
        odName: req.fromName,
        userId: user.uid,
        friendId: req.fromId,
        friendName: req.fromName,
        friendUsername: req.fromUsername,
        friendPhoto: req.fromPhoto,
        since: now,
      });
      await addFriend(req.fromId, {
        odId: user.uid,
        odName: user.displayName,
        userId: req.fromId,
        friendId: user.uid,
        friendName: user.displayName,
        friendUsername: user.username,
        friendPhoto: user.photoURL,
        since: now,
      });
    } catch (err) {
      showError("Failed to accept request");
    }
  };

  const handleReject = async (req: FriendRequest) => {
    try {
      await respondToFriendRequest(req.id, "rejected");
    } catch {
      showError("Failed to reject request");
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    if (!user) return;
    setRemoving(friend.id);
    try {
      await removeFriendBidirectional(user.uid, friend.friendId);
    } catch {
      showError("Failed to remove friend");
    }
    setRemoving(null);
  };

  const handleChat = async (friend: Friend) => {
    if (!user) return;
    try {
      let chat = await findPrivateChat(user.uid, friend.friendId);
      if (!chat) {
        const id = await createChat({
          type: "private",
          name: "",
          members: [user.uid, friend.friendId],
          memberNames: { [user.uid]: user.displayName, [friend.friendId]: friend.friendName },
          memberPhotos: { [user.uid]: user.photoURL, [friend.friendId]: friend.friendPhoto },
          lastMessage: "",
          lastMessageBy: "",
          updatedAt: Date.now(),
          createdBy: user.uid,
        });
        chat = { id } as any;
      }
      router.push(`/chat/${chat!.id}`);
    } catch {
      showError("Failed to open chat");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Friends</h1>
        <Link
          href="/search"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          <HiUserPlus className="w-4 h-4" />
          <span className="hidden xs:inline">Find Friends</span>
          <span className="xs:hidden">Add</span>
        </Link>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>
      )}

      <div className="flex gap-2 bg-white rounded-xl p-1 border border-blue-50">
        {(["friends", "requests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === t ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "friends" ? "My Friends" : `Requests ${requests.length > 0 ? `(${requests.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-gray-500 text-sm">No pending requests</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 overflow-hidden shrink-0">
                    {req.fromPhoto ? (
                      <img src={req.fromPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold">
                        {req.fromName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{req.fromName}</div>
                    <div className="text-gray-400 text-xs truncate">@{req.fromUsername}</div>
                  </div>
                </div>
                {req.note && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 rounded-xl text-sm text-gray-600 italic">
                    &ldquo;{req.note}&rdquo;
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleAccept(req)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                    <HiCheck className="w-4 h-4" /> Accept
                  </button>
                  <button onClick={() => handleReject(req)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    <HiXMark className="w-4 h-4" /> Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "friends" && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-600">No friends yet</h3>
              <p className="text-gray-400 text-sm mt-1">Search for people to connect with</p>
              <Link href="/search" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors">
                <HiMagnifyingGlass className="w-4 h-4" /> Find Friends
              </Link>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="bg-white rounded-2xl border border-blue-50 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 overflow-hidden shrink-0">
                    {friend.friendPhoto ? (
                      <img src={friend.friendPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold">
                        {friend.friendName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{friend.friendName}</div>
                    <div className="text-gray-400 text-xs truncate">@{friend.friendUsername}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleChat(friend)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                      <HiChatBubbleLeftEllipsis className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend)}
                      disabled={removing === friend.id}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <HiUserMinus className={`w-5 h-5 ${removing === friend.id ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
