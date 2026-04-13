"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { subscribeToMessages, sendMessage } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { Message, Chat } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { HiArrowLeft, HiPaperAirplane, HiUserGroup } from "react-icons/hi2";

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChat = async () => {
      const snap = await getDoc(doc(getFirebaseDb(), "chats", chatId));
      if (snap.exists()) {
        setChat({ ...snap.data(), id: snap.id } as Chat);
      }
    };
    fetchChat();
  }, [chatId]);

  useEffect(() => {
    const unsub = subscribeToMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    await sendMessage({
      chatId,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      content: text.trim(),
      createdAt: Date.now(),
    });
    setText("");
    setSending(false);
  };

  const getChatTitle = () => {
    if (!chat || !user) return "Chat";
    if (chat.type === "group") return chat.name;
    const otherId = chat.members.find((m) => m !== user.uid) || "";
    return chat.memberNames?.[otherId] || "Chat";
  };

  const getChatPhoto = () => {
    if (!chat || !user) return null;
    if (chat.type === "group") return null;
    const otherId = chat.members.find((m) => m !== user.uid) || "";
    return chat.memberPhotos?.[otherId] || null;
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-blue-50">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-blue-50 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
          {chat?.type === "group" ? (
            <HiUserGroup className="w-5 h-5 text-blue-600" />
          ) : getChatPhoto() ? (
            <img src={getChatPhoto()!} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-600 font-semibold text-sm">{getChatTitle()?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">{getChatTitle()}</h2>
          {chat?.type === "group" && (
            <p className="text-xs text-gray-400">{chat.members.length} members</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-400 text-sm">Start the conversation</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden shrink-0">
                  {msg.senderPhoto ? (
                    <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                      {msg.senderName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && chat?.type === "group" && (
                  <p className="text-xs text-gray-400 mb-0.5 ml-1">{msg.senderName}</p>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white border border-blue-50 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                  {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="pt-3 border-t border-blue-50">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-white border border-blue-100 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <HiPaperAirplane className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
