"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getFirebaseAuth } from "@/lib/firebase";
import { subscribeToChats } from "@/lib/firestore";
import { Chat } from "@/types";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiPencilSquare, HiArrowRightOnRectangle, HiBriefcase, HiUserGroup } from "react-icons/hi2";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [groupChats, setGroupChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, (chats) => {
      setGroupChats(chats.filter((c) => c.type === "group"));
    });
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    setUser(null);
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-blue-50 overflow-hidden">
        <div className="h-28 sm:h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400" />

        <div className="px-4 sm:px-6 pb-5">
          <div className="-mt-12 sm:-mt-14 mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white bg-blue-100 overflow-hidden shadow-lg">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600 text-2xl sm:text-3xl font-bold">
                  {user.displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{user.displayName}</h1>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              {user.division && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                  <HiBriefcase className="w-4 h-4 shrink-0" />
                  <span className="truncate">{user.division}</span>
                </div>
              )}
              {user.bio && (
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{user.bio}</p>
              )}
            </div>

            <Link
              href="/profile/edit"
              className="self-start flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors shrink-0"
            >
              <HiPencilSquare className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-blue-50 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Account</h3>
        <div className="space-y-2 text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-0.5">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-800 text-xs sm:text-sm break-all">{user.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Username</span>
            <span className="text-gray-800">@{user.username}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Division</span>
            <span className="text-gray-800">{user.division || "Not set"}</span>
          </div>
        </div>
      </div>

      {/* Group Chats */}
      <div className="bg-white rounded-2xl border border-blue-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Group Chats</h3>
          <span className="text-xs text-gray-400">{groupChats.length} group{groupChats.length !== 1 ? "s" : ""}</span>
        </div>

        {groupChats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Not in any group chats yet</p>
        ) : (
          <div className="space-y-2">
            {groupChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <HiUserGroup className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{chat.name}</p>
                  <p className="text-xs text-gray-400">{chat.members.length} members</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-2xl border border-red-100 text-red-500 font-medium hover:bg-red-50 transition-colors"
      >
        <HiArrowRightOnRectangle className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}
