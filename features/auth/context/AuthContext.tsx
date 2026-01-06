"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/lib/stores/user-store";
import api from "@/lib/api";

type User = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Use Zustand store as single source of truth
  const { user, loading, setUser, setLoading, fetchUser } = useUserStore();

  // Fetch user on mount ONLY if not already loaded
  useEffect(() => {
    // Only fetch if we haven't loaded yet (still loading and no user)
    if (loading && !user) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - intentionally run once on mount only

  const refreshUser = async () => {
    await fetchUser();
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);

      // Pre-fetch avatar URL if user has one
      if (data.user?.avatar) {
        useUserStore.getState().fetchAvatarUrl(data.user.avatar);
      }

      return {};
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { error: err.response?.data?.error || "Login failed" };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      setUser(data.user);
      return {};
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { error: err.response?.data?.error || "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      setLoading(true); // Reset loading for next login
      useUserStore.getState().clearAvatarCache();
      router.push(`/${locale}/login`);
      router.refresh();
    } catch {
      // Ignore errors on logout
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
