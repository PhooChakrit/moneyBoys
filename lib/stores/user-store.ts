import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  // User data
  user: User | null;
  loading: boolean;
  isOAuthUser: boolean | null;

  // Current user's avatar as base64 (cached)
  userAvatarBase64: string | null;
  avatarLoading: boolean;

  // Avatar URL cache for OTHER users (key -> signed URL)
  avatarUrlCache: Map<string, string>;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;

  // OAuth check
  checkIsOAuthUser: () => Promise<boolean>;

  // Avatar management
  fetchUserAvatarBase64: () => Promise<void>;
  setUserAvatarBase64: (base64: string | null) => void;
  getAvatarUrl: (key: string | null | undefined) => string | null;
  fetchAvatarUrl: (key: string) => Promise<string | null>;
  clearAvatarCache: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  isOAuthUser: null,
  userAvatarBase64: null,
  avatarLoading: false,
  avatarUrlCache: new Map(),

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  fetchUser: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });

      // Pre-fetch user avatar as base64 if user has one
      if (data.user?.avatar) {
        get().fetchUserAvatarBase64();
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors
    }
    set({
      user: null,
      isOAuthUser: null,
      userAvatarBase64: null,
      avatarUrlCache: new Map(),
    });
  },

  checkIsOAuthUser: async () => {
    const current = get().isOAuthUser;
    if (current !== null) {
      return current;
    }

    try {
      const { data } = await api.get("/auth/profile");
      const isOAuth = !data.user?.password;
      set({ isOAuthUser: isOAuth });
      return isOAuth;
    } catch {
      set({ isOAuthUser: false });
      return false;
    }
  },

  fetchUserAvatarBase64: async () => {
    const user = get().user;
    if (!user?.avatar || get().userAvatarBase64 || get().avatarLoading) {
      return; // Already cached, loading, or no avatar
    }

    set({ avatarLoading: true });

    try {
      // If avatar is already a full URL (legacy), use it directly
      if (user.avatar.startsWith("http")) {
        set({ userAvatarBase64: user.avatar, avatarLoading: false });
        return;
      }

      // Get signed URL first
      const { data } = await api.post("/image-url", { key: user.avatar });
      const imageUrl = data.url;

      // Fetch image and convert to base64 (client-side, CORS enabled on R2)
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      set({ userAvatarBase64: base64, avatarLoading: false });
    } catch {
      set({ avatarLoading: false });
    }
  },

  setUserAvatarBase64: (base64) => set({ userAvatarBase64: base64 }),

  // For OTHER users (group members etc) - still use signed URL cache
  getAvatarUrl: (key) => {
    if (!key) return null;
    if (key.startsWith("http")) return key;

    const cache = get().avatarUrlCache;
    if (cache.has(key)) {
      return cache.get(key) || null;
    }

    get().fetchAvatarUrl(key);
    return null;
  },

  fetchAvatarUrl: async (key) => {
    if (!key || key.startsWith("http")) return key;

    const cache = get().avatarUrlCache;
    if (cache.has(key)) {
      return cache.get(key) || null;
    }

    try {
      const { data } = await api.post("/image-url", { key });
      const url = data.url;

      set((state) => ({
        avatarUrlCache: new Map(state.avatarUrlCache).set(key, url),
      }));

      return url;
    } catch {
      return null;
    }
  },

  clearAvatarCache: () =>
    set({ avatarUrlCache: new Map(), userAvatarBase64: null }),
}));
