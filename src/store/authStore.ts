"use client";

import { create } from "zustand";
import { UserProfile } from "@/types";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  googleAccessToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setGoogleAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  googleAccessToken: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setGoogleAccessToken: (googleAccessToken) => set({ googleAccessToken }),
}));
