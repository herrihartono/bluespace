"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { searchUsers, sendFriendRequest, getFriendIds } from "@/lib/firestore";
import { UserProfile } from "@/types";
import { HiMagnifyingGlass, HiUserPlus, HiCheck, HiBriefcase } from "react-icons/hi2";

export default function SearchPage() {
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [noteModal, setNoteModal] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const handleSearch = async () => {
    if (!query.trim() || !user) return;
    setSearching(true);
    const users = await searchUsers(query.trim());
    setResults(users.filter((u) => u.uid !== user.uid));
    const ids = await getFriendIds(user.uid);
    setFriendIds(ids);
    setSearching(false);
  };

  const handleSendRequest = async (target: UserProfile) => {
    if (!user) return;
    await sendFriendRequest({
      fromId: user.uid,
      fromName: user.displayName,
      fromUsername: user.username,
      fromPhoto: user.photoURL,
      toId: target.uid,
      toName: target.displayName,
      toUsername: target.username,
      note,
      status: "pending",
      createdAt: Date.now(),
    });
    setSentRequests((prev) => new Set(prev).add(target.uid));
    setNoteModal(null);
    setNote("");
  };

  const modalTarget = results.find((p) => p.uid === noteModal);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Search People</h1>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by username..."
            className="w-full pl-11 pr-3 py-3 bg-white border border-blue-100 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      <div className="space-y-3">
        {results.map((person) => {
          const isFriend = friendIds.includes(person.uid);
          const requestSent = sentRequests.has(person.uid);

          return (
            <div key={person.uid} className="bg-white rounded-2xl border border-blue-50 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 overflow-hidden shrink-0">
                  {person.photoURL ? (
                    <img src={person.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold">
                      {person.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{person.displayName}</div>
                  <div className="text-gray-400 text-xs truncate">@{person.username}</div>
                  {person.division && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <HiBriefcase className="w-3 h-3 shrink-0" />
                      <span className="truncate">{person.division}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {isFriend ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1.5 rounded-full font-medium">
                      <HiCheck className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Friend</span>
                    </span>
                  ) : requestSent ? (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-full font-medium">
                      Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => setNoteModal(person.uid)}
                      className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors"
                    >
                      <HiUserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!searching && results.length === 0 && query && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-sm">No users found</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-gray-600">Find People</h3>
            <p className="text-gray-400 text-sm mt-1">Search by username to connect</p>
          </div>
        )}
      </div>

      {noteModal && modalTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) { setNoteModal(null); setNote(""); } }}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Add Friend</h3>
              <p className="text-sm text-gray-500 mb-4">Send a note with your request to @{modalTarget.username}</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi! I'd like to connect..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setNoteModal(null); setNote(""); }}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendRequest(modalTarget)}
                  className="flex-1 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
