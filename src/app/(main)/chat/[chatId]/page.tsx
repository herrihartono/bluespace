"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { subscribeToMessages, sendMessage, markChatRead, setTypingStatus, subscribeToChatDoc } from "@/lib/firestore";
import { Message, Chat, PendingMessage, MAX_MESSAGE_LENGTH } from "@/types";
import { formatTimestamp, formatChatDate, isSameDay } from "@/lib/formatTime";
import { HiArrowLeft, HiPaperAirplane, HiUserGroup, HiExclamationCircle, HiArrowPath } from "react-icons/hi2";
import { v4 as uuidv4 } from "uuid";

const TYPING_DEBOUNCE = 2000;
const TYPING_TIMEOUT = 5000;

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingRef = useRef(0);

  useEffect(() => {
    setChat(null);
    setLoading(true);
    setAccessDenied(false);
    setMessages([]);
    setMessagesError(null);
    setPendingMessages([]);

    const unsub = subscribeToChatDoc(chatId, (c) => {
      setChat(c);
      setLoading(false);
      if (c && user && !c.members.includes(user.uid)) {
        setAccessDenied(true);
      } else {
        setAccessDenied(false);
      }
    });
    return () => unsub();
  }, [chatId, user]);

  useEffect(() => {
    if (accessDenied || !chat) return;
    setMessagesError(null);
    const unsub = subscribeToMessages(
      chatId,
      setMessages,
      (err) => setMessagesError("Failed to load messages. The database index may still be building."),
      50,
    );
    return () => unsub();
  }, [chatId, accessDenied, chat]);

  useEffect(() => {
    if (chat && user) {
      markChatRead(chatId, user.uid);
    }
  }, [chat, user, chatId, messages.length]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pendingMessages]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const handleTyping = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastTypingRef.current > TYPING_DEBOUNCE) {
      lastTypingRef.current = now;
      setTypingStatus(chatId, user.uid, true);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTypingStatus(chatId, user.uid, false);
    }, TYPING_TIMEOUT);
  }, [chatId, user]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (user) setTypingStatus(chatId, user.uid, false);
    };
  }, [chatId, user]);

  const handleSend = async () => {
    if (!user || !text.trim() || text.length > MAX_MESSAGE_LENGTH) return;

    const content = text.trim();
    const tempId = uuidv4();
    const pending: PendingMessage = {
      id: tempId,
      chatId,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      content,
      createdAt: Date.now(),
      status: "sending",
    };

    setText("");
    setError(null);
    setPendingMessages((prev) => [...prev, pending]);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTypingStatus(chatId, user.uid, false);

    try {
      await sendMessage({
        chatId,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        content,
        createdAt: Date.now(),
      });
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
    } catch (err: any) {
      setPendingMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" as const } : m))
      );
      setError("Failed to send message");
    }
  };

  const handleRetry = async (msg: PendingMessage) => {
    setPendingMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, status: "sending" as const } : m))
    );
    try {
      await sendMessage({
        chatId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderPhoto: msg.senderPhoto,
        content: msg.content,
        createdAt: Date.now(),
      });
      setPendingMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch {
      setPendingMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "failed" as const } : m))
      );
    }
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

  const typingUsers = chat?.typing
    ? Object.entries(chat.typing)
        .filter(([uid, ts]) => uid !== user?.uid && Date.now() - ts < TYPING_TIMEOUT)
        .map(([uid]) => chat.memberNames?.[uid] || "Someone")
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-8rem)]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied || !chat) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-8rem)] gap-4">
        <HiExclamationCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 font-medium">{accessDenied ? "You don't have access to this chat" : "Chat not found"}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">Go Back</button>
      </div>
    );
  }

  const allMessages = [
    ...messages,
    ...pendingMessages.filter((pm) => !messages.some((m) => m.content === pm.content && m.senderId === pm.senderId && Math.abs(m.createdAt - pm.createdAt) < 5000)),
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-blue-50">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-blue-50 transition-colors">
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
          {chat.type === "group" ? (
            <HiUserGroup className="w-5 h-5 text-blue-600" />
          ) : getChatPhoto() ? (
            <img src={getChatPhoto()!} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-600 font-semibold text-sm">{getChatTitle()?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">{getChatTitle()}</h2>
          {typingUsers.length > 0 ? (
            <p className="text-xs text-blue-500 animate-pulse">{typingUsers.join(", ")} typing...</p>
          ) : chat.type === "group" ? (
            <p className="text-xs text-gray-400">{chat.members.length} members</p>
          ) : null}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-3"
      >
        {messagesError && (
          <div className="text-center py-4">
            <p className="text-red-500 text-xs bg-red-50 inline-block px-4 py-2 rounded-xl">{messagesError}</p>
          </div>
        )}

        {!messagesError && allMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-400 text-sm">Start the conversation</p>
          </div>
        )}

        {allMessages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          const isPending = "status" in msg;
          const pendingStatus = isPending ? (msg as PendingMessage).status : null;
          const prevMsg = idx > 0 ? allMessages[idx - 1] : null;
          const showDateSep = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-3">
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {formatChatDate(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
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
                  {!isMe && chat.type === "group" && (
                    <p className="text-xs text-gray-400 mb-0.5 ml-1">{msg.senderName}</p>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? pendingStatus === "failed"
                          ? "bg-red-100 text-red-700 rounded-br-md"
                          : pendingStatus === "sending"
                          ? "bg-blue-400 text-white rounded-br-md opacity-70"
                          : "bg-blue-600 text-white rounded-br-md"
                        : "bg-white border border-blue-50 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "justify-end mr-1" : "ml-1"}`}>
                    <span className="text-[10px] text-gray-400">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                    {pendingStatus === "sending" && (
                      <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    )}
                    {pendingStatus === "failed" && (
                      <button onClick={() => handleRetry(msg as PendingMessage)} className="flex items-center gap-0.5 text-[10px] text-red-500 hover:text-red-600">
                        <HiArrowPath className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 text-center">
          {error}
        </div>
      )}

      <div className="pt-3 border-t border-blue-50">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                setText(e.target.value);
                handleTyping();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1 px-4 py-3 bg-white border border-blue-100 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || text.length > MAX_MESSAGE_LENGTH}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <HiPaperAirplane className="w-5 h-5" />
          </button>
        </div>
        {text.length > MAX_MESSAGE_LENGTH * 0.9 && (
          <p className="text-[10px] text-gray-400 mt-1 text-right">{text.length}/{MAX_MESSAGE_LENGTH}</p>
        )}
      </div>
    </div>
  );
}
