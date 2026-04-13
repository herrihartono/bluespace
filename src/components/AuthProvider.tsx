"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firestore";
import { useAuthStore } from "@/store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    // Restore cached Google access token if still valid
    try {
      const cached = localStorage.getItem("gat");
      const exp = parseInt(localStorage.getItem("gat_exp") || "0", 10);
      if (cached && Date.now() < exp) {
        useAuthStore.getState().setGoogleAccessToken?.(cached);
      }
    } catch {}

    const unsub = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        const current = useAuthStore.getState().user;
        if (current?.uid === firebaseUser.uid) {
          // Token refresh only — do not overwrite in-memory profile updates
          setLoading(false);
          return;
        }
        // New sign-in or fresh page load — fetch profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        // Clear cached Google token on sign-out
        try {
          localStorage.removeItem("gat");
          localStorage.removeItem("gat_exp");
          localStorage.removeItem("gsheets");
        } catch {}
        setLoading(false);
      }
    });
    return () => unsub();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
