"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon, ChevronRightIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/features/auth/context/AuthContext";

interface GroupData {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  members: number;
  balance: number;
  avatars: string[];
  role: string;
}

export function GroupsScreen() {
  const t = useTranslations("groups");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { user } = useAuth();

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create group dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [allowMemberEdit, setAllowMemberEdit] = useState(false);
  const [creating, setCreating] = useState(false);

  // Join group dialog state
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups");
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data.groups || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
          allowMemberEdit,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group");
      }

      const data = await res.json();
      setGroups((prev) => [data.group, ...prev]);
      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setAllowMemberEdit(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  // Join group with code
  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;

    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join group");
      }

      const data = await res.json();
      // Refresh groups list
      const groupsRes = await fetch("/api/groups");
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }
      setJoinDialogOpen(false);
      setJoinCode("");
      // Navigate to the joined group
      router.push(`/${locale}/groups/${data.group.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <AvatarDisplay
            avatarKey={user?.avatar}
            name={user?.name || "Guest"}
            size="md"
            isCurrentUser
          />
        </div>
      </div>

      {error && (
        <div className="px-5 lg:px-8 mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Join Group Section */}
      <div className="px-5 lg:px-8 mb-4">
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors">
              {t("joinGroupWithCode") || "Join group with code"}
            </button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {t("joinGroup") || "Join Group"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={t("enterInviteCode") || "Enter invite code"}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono dark:bg-gray-700 dark:text-white"
              />
              <Button
                onClick={handleJoinGroup}
                disabled={joining || joinCode.length < 6}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                {joining ? t("joining") || "Joining..." : t("join") || "Join"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-5 lg:px-8">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("noGroups") || "You are not in any groups yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Link key={group.id} href={`/${locale}/groups/${group.id}`}>
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {group.avatars.slice(0, 3).map((a, i) => (
                            <Avatar
                              key={i}
                              className="w-8 h-8 border-2 border-white dark:border-gray-800"
                            >
                              <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-white">
                                {a}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {group.members > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                              +{group.members - 3}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {group.name}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {group.members} {t("peopleCount")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            group.balance > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : group.balance < 0
                                ? "text-red-500 dark:text-red-400"
                                : "text-gray-400"
                          }`}
                        >
                          {group.balance > 0 ? "+" : ""}฿
                          {group.balance.toFixed(2)}
                        </p>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {t("createGroup") || "Create New Group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("groupName") || "Group Name"}
              </label>
              <Input
                placeholder={t("groupNamePlaceholder") || "e.g., Trip to Japan"}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("description") || "Description"} (
                {t("optional") || "optional"})
              </label>
              <Input
                placeholder={
                  t("descriptionPlaceholder") || "What is this group for?"
                }
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="mt-1 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowMemberEdit"
                checked={allowMemberEdit}
                onChange={(e) => setAllowMemberEdit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
              />
              <label
                htmlFor="allowMemberEdit"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                {t("allowMemberEdit") ||
                  "Allow all members to edit transactions"}
              </label>
            </div>
            <Button
              onClick={handleCreateGroup}
              disabled={creating || !newGroupName.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              {creating
                ? t("creating") || "Creating..."
                : t("create") || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB */}
      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors lg:bottom-8"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
