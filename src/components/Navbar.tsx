"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { HiBell } from "react-icons/hi2";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-blue-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2">
          <HiChatBubbleLeftRight className="w-7 h-7 text-blue-600" />
          <span className="text-xl font-bold text-blue-600 hidden sm:block">BlueSpace</span>
        </Link>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-full hover:bg-blue-50 transition-colors">
            <HiBell className="w-5 h-5 text-gray-500" />
          </button>
          {user && (
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {user.displayName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
