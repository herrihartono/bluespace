"use client";

import { useAuthStore } from "@/store/authStore";
import { getFirebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiPencilSquare, HiArrowRightOnRectangle, HiBriefcase } from "react-icons/hi2";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    setUser(null);
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-blue-50 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400" />

        <div className="px-6 pb-6">
          <div className="-mt-14 mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-white bg-blue-100 overflow-hidden shadow-lg">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                  {user.displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
              <p className="text-gray-500">@{user.username}</p>
              {user.division && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                  <HiBriefcase className="w-4 h-4" />
                  <span>{user.division}</span>
                </div>
              )}
              {user.bio && (
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{user.bio}</p>
              )}
            </div>

            <Link
              href="/profile/edit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors"
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
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-800">{user.email}</span>
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
