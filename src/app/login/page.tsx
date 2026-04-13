"use client";

import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

export default function LoginPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    getRedirectResult(getFirebaseAuth())
      .then(async (result) => {
        if (result?.user) {
          const { uid, email, displayName, photoURL } = result.user;
          let profile = await getUserProfile(uid);
          if (!profile) {
            profile = {
              uid,
              email: email || "",
              username: (email?.split("@")[0] || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
              displayName: displayName || "User",
              photoURL: photoURL || "",
              division: "",
              bio: "",
              createdAt: Date.now(),
            };
            await createUserProfile(profile);
          }
          setUser(profile);
          router.push("/feed");
        }
      })
      .catch((err) => console.error("Redirect result error:", err));
  }, [setUser, router]);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      const { uid, email, displayName, photoURL } = result.user;

      let profile = await getUserProfile(uid);
      if (!profile) {
        profile = {
          uid,
          email: email || "",
          username: (email?.split("@")[0] || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
          displayName: displayName || "User",
          photoURL: photoURL || "",
          division: "",
          bio: "",
          createdAt: Date.now(),
        };
        await createUserProfile(profile);
      }
      setUser(profile);
      router.push("/feed");
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        await signInWithRedirect(getFirebaseAuth(), getGoogleProvider());
        return;
      }
      console.error("Login failed:", err);
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <HiChatBubbleLeftRight className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">BlueSpace</h1>
          <p className="text-blue-100 text-lg">Connect with your community</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
            Welcome
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Sign in to continue to BlueSpace
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 group disabled:opacity-60"
          >
            {loggingIn ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <FcGoogle className="w-6 h-6" />
            )}
            <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
              {loggingIn ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <p className="text-xs text-gray-400 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
