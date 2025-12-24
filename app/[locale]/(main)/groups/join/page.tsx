"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/context/AuthContext";

interface GroupPreview {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  avatars: string[];
}

export default function JoinGroupPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { user } = useAuth();

  const code = searchParams.get("code");
  const groupId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [joined, setJoined] = useState(false);

  // Fetch group preview info
  useEffect(() => {
    if (!code && !groupId) {
      setError("No invite code or group ID provided");
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const queryParam = code ? `code=${code}` : `id=${groupId}`;
        const res = await fetch(`/api/groups/preview?${queryParam}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load group");
        }

        setGroupPreview(data.group);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [code, groupId]);

  // Handle join confirmation
  const handleJoin = async () => {
    if (user === null) {
      // Not logged in, redirect to login with return URL
      const returnUrl = encodeURIComponent(
        `/${locale}/groups/join?${code ? `code=${code}` : `id=${groupId}`}`
      );
      router.push(`/${locale}/login?returnUrl=${returnUrl}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: code || undefined,
          groupId: groupId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If already a member, just redirect to the group
        if (data.error?.includes("already a member") && groupPreview) {
          router.push(`/${locale}/groups/${groupPreview.id}`);
          return;
        }
        throw new Error(data.error || "Failed to join group");
      }

      setJoined(true);
      // Redirect to the group after a short delay
      setTimeout(() => {
        router.push(`/${locale}/groups/${data.group.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Error state
  if (error && !groupPreview) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Unable to Join
            </h2>
            <p className="text-red-500 mb-6">{error}</p>
            <Button
              onClick={() => router.push(`/${locale}/groups`)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Go to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (joined && groupPreview) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Welcome to {groupPreview.name}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Redirecting you to the group...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation modal
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg dark:bg-gray-800">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Join Group
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              You&apos;ve been invited to join
            </p>
          </div>

          {groupPreview && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                {groupPreview.name}
              </h3>
              {groupPreview.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                  {groupPreview.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {groupPreview.avatars.slice(0, 4).map((avatar, i) => (
                    <Avatar
                      key={i}
                      className="w-8 h-8 border-2 border-white dark:border-gray-700"
                    >
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        {avatar}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {groupPreview.memberCount > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                      +{groupPreview.memberCount - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {groupPreview.memberCount} member
                  {groupPreview.memberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/groups`)}
              className="flex-1"
              disabled={joining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              {joining ? "Joining..." : user ? "Join Group" : "Login to Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
