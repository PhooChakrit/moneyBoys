"use client";

import { useEffect, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/lib/stores/user-store";

interface AvatarDisplayProps {
  avatarKey: string | null | undefined;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isCurrentUser?: boolean; // Use base64 cache for current user
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-2xl",
};

export function AvatarDisplay({
  avatarKey,
  name,
  size = "md",
  className = "",
  isCurrentUser = false,
}: AvatarDisplayProps) {
  const {
    user,
    userAvatarBase64,
    fetchUserAvatarBase64,
    fetchAvatarUrl,
    avatarUrlCache,
  } = useUserStore();

  // Determine if this is the current user's avatar
  const isUserAvatar =
    isCurrentUser || (user?.avatar && avatarKey === user.avatar);

  // For current user: trigger base64 fetch if not cached
  useEffect(() => {
    if (isUserAvatar && !userAvatarBase64) {
      fetchUserAvatarBase64();
    }
  }, [isUserAvatar, userAvatarBase64, fetchUserAvatarBase64]);

  // For other users: trigger signed URL fetch if not cached
  useEffect(() => {
    if (
      !isUserAvatar &&
      avatarKey &&
      !avatarKey.startsWith("http") &&
      !avatarUrlCache.has(avatarKey)
    ) {
      fetchAvatarUrl(avatarKey);
    }
  }, [isUserAvatar, avatarKey, avatarUrlCache, fetchAvatarUrl]);

  // Derive avatar URL
  const avatarUrl = useMemo(() => {
    if (!avatarKey) return null;

    // For current user: use cached base64
    if (isUserAvatar && userAvatarBase64) {
      return userAvatarBase64;
    }

    // Legacy full URL
    if (avatarKey.startsWith("http")) return avatarKey;

    // For other users: use signed URL cache
    return avatarUrlCache.get(avatarKey) || null;
  }, [avatarKey, isUserAvatar, userAvatarBase64, avatarUrlCache]);

  const initials = useMemo(() => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatarUrl || undefined} alt={name} />
      <AvatarFallback
        className={`bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold ${textSizeClasses[size]}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
