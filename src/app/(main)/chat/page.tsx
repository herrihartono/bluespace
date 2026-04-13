"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { subscribeToChats, subscribeToFriends, createChat } from "@/lib/firestore";
import { Chat, Friend } from "@/types";
import Link from "next/link";
import { HiPlus, HiUserGroup, HiChatBubbleLeftEllipsis, HiXMark } from "react-icons/hi2";
import { formatDistanceToNow } from "date-fns";

export default function ChatListPage() {
  const user = useAuthStore((s) => s.user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, setChats);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFriends(user.uid, setFriends);
    return () => unsub();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedMembers.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      const allMembers = [user.uid, ...selectedMembers];
      const memberNames: Record<string, string> = { [user.uid]: user.displayName };
      const memberPhotos: Record<string, string> = { [user.uid]: user.photoURL };
      friends.forEach((f) => {
        if (selectedMembers.includes(f.friendId)) {
          memberNames[f.friendId] = f.friendName;
          memberPhotos[f.friendId] = f.friendPhoto;
        }
      });

      await createChat({
        type: "group",
        name: groupName.trim(),
        members: allMembers,
        memberNames,
        memberPhotos,
        lastMessage: "",
        lastMessageBy: "",
        updatedAt: Date.now(),
        createdBy: user.uid,
      });
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedMembers([]);
    } catch (err: any) {
      setError(err?.message || "Failed to create group");
    }
    setCreating(false);
  };

  const getChatDisplay = (chat: Chat) => {
    if (chat.type === "group") {
      return { name: chat.name, photo: null, isGroup: true };
    }
    const otherId = chat.members.find((m) => m !== user?.uid) || "";
    return {
      name: chat.memberNames?.[otherId] || "Unknown",
      photo: chat.memberPhotos?.[otherId] || "",
      isGroup: false,
    };
  };

  const isUnread = (chat: Chat) => {
    if (!user) return false;
    const lastRead = chat.lastReadAt?.[user.uid] || 0;
    return chat.updatedAt > lastRead && chat.lastMessageBy !== user.uid;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="w-4 h-4" />
          Group
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-gray-600">No messages yet</h3>
          <p className="text-gray-400 text-sm mt-1">Start a conversation from your friends list</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => {
            const display = getChatDisplay(chat);
            const unread = isUnread(chat);
            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={`flex items-center gap-3 bg-white rounded-2xl border p-4 hover:shadow-md transition-shadow ${
                  unread ? "border-blue-200 bg-blue-50/30" : "border-blue-50"
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {display.isGroup ? (
                      <HiUserGroup className="w-6 h-6 text-blue-600" />
                    ) : display.photo ? (
                      <img src={display.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-blue-600 font-semibold">{display.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  {unread && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${unread ? "font-bold text-gray-900" : "font-semibold text-gray-900"}`}>
                      {display.name}
                    </span>
                    {chat.updatedAt && (
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className={`text-sm truncate mt-0.5 ${unread ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                      {chat.lastMessage}
                    </p>
                  )}
                  {display.isGroup && (
                    <p className="text-xs text-gray-400 mt-0.5">{chat.members.length} members</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreateGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateGroup(false); setError(null); } }}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">New Group Chat</h3>
                <button onClick={() => { setShowCreateGroup(false); setError(null); }} className="p-1 hover:bg-gray-100 rounded-full">
                  <HiXMark className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name..."
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />

              <p className="text-sm font-medium text-gray-600 mb-2">
                Select members {selectedMembers.length > 0 && `(${selectedMembers.length})`}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {friends.map((f) => (
                  <label
                    key={f.friendId}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(f.friendId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers((m) => [...m, f.friendId]);
                        } else {
                          setSelectedMembers((m) => m.filter((x) => x !== f.friendId));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0">
                      {f.friendPhoto ? (
                        <img src={f.friendPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                          {f.friendName?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{f.friendName}</span>
                  </label>
                ))}
                {friends.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Add friends first</p>
                )}
              </div>

              {error && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>
              )}

              <button
                onClick={handleCreateGroup}
                disabled={creating || !groupName.trim() || selectedMembers.length === 0}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
