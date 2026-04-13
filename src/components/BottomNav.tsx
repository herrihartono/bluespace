"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { HiHome, HiMagnifyingGlass, HiUserGroup, HiChatBubbleLeftEllipsis, HiUser } from "react-icons/hi2";
import { useNotificationStore } from "@/store/notificationStore";

export default function BottomNav() {
  const pathname = usePathname();
  const { unreadChats, pendingRequests, unreadPosts, setUnreadPosts } = useNotificationStore();

  // Clear feed badge when user visits /feed
  useEffect(() => {
    if (pathname.startsWith("/feed")) {
      try {
        localStorage.setItem("lastSeenFeed", String(Date.now()));
      } catch {}
      setUnreadPosts(0);
    }
  }, [pathname, setUnreadPosts]);

  const navItems = [
    { href: "/feed", icon: HiHome, label: "Feed", badge: unreadPosts },
    { href: "/search", icon: HiMagnifyingGlass, label: "Search", badge: 0 },
    { href: "/friends", icon: HiUserGroup, label: "Friends", badge: pendingRequests },
    { href: "/chat", icon: HiChatBubbleLeftEllipsis, label: "Chat", badge: unreadChats },
    { href: "/profile", icon: HiUser, label: "Profile", badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-blue-100 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${active ? "scale-110" : ""} transition-transform`} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
