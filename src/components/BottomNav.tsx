"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiHome, HiMagnifyingGlass, HiUserGroup, HiChatBubbleLeftEllipsis, HiUser } from "react-icons/hi2";

const navItems = [
  { href: "/feed", icon: HiHome, label: "Feed" },
  { href: "/search", icon: HiMagnifyingGlass, label: "Search" },
  { href: "/friends", icon: HiUserGroup, label: "Friends" },
  { href: "/chat", icon: HiChatBubbleLeftEllipsis, label: "Chat" },
  { href: "/profile", icon: HiUser, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-blue-100 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
