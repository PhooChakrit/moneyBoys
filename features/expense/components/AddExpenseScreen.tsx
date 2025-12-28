"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon } from "@/components/icons";
import { useAuth } from "@/features/auth/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface GroupMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface GroupOption {
  id: string;
  name: string;
}

export function AddExpenseScreen() {
  const t = useTranslations("addExpense");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const urlGroupId = searchParams.get("groupId");
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [customAmounts, setCustomAmounts] = useState<{
    [userId: string]: string;
  }>({});
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Group selection state
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    urlGroupId
  );

  // Fetch user's groups only
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups");
        if (res.ok) {
          const data = await res.json();
          setGroups(
            data.groups.map((g: { id: string; name: string }) => ({
              id: g.id,
              name: g.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };

    fetchGroups();
  }, []);

  // Fetch members when group changes (from URL or selection)
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/groups/${selectedGroupId}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members);
          if (user?.id) {
            setPaidById(user.id);
            setSelectedMembers(data.members.map((m: GroupMember) => m.userId));
          }
        }
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };

    fetchMembers();
  }, [selectedGroupId, user?.id]);

  // Handle group selection - just update state, useEffect fetches members
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    // Clear previous members while new ones load (optional, for smooth transition)
    setMembers([]);
    setSelectedMembers([]);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !amount ||
      !paidById ||
      !selectedMembers.length ||
      !selectedGroupId
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Build splits based on split type
      let splits;
      if (splitEqually) {
        // Equal split - each person gets share of 1
        splits = selectedMembers.map((userId) => ({
          userId,
          share: 1,
        }));
      } else {
        // Custom split - calculate shares based on custom amounts
        const totalCustom = selectedMembers.reduce(
          (sum, userId) => sum + (parseFloat(customAmounts[userId]) || 0),
          0
        );

        if (totalCustom <= 0) {
          setError("Please enter amounts for each person");
          setSubmitting(false);
          return;
        }

        // Warn if total doesn't match but still allow (API will handle calculation)
        splits = selectedMembers.map((userId) => ({
          userId,
          share: parseFloat(customAmounts[userId]) || 0,
        }));
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          title,
          amount: parseFloat(amount),
          paidById,
          splits,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add expense");
        return;
      }

      // Success - go back to group detail
      router.push(`/${locale}/groups/${selectedGroupId}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={
              selectedGroupId
                ? `/${locale}/groups/${selectedGroupId}`
                : `/${locale}/groups`
            }
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Group Selector - Only show when not coming from a specific group */}
        {!urlGroupId && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Group
            </label>
            {groups.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  You need to join a group first
                </p>
                <Link href={`/${locale}/groups`}>
                  <Button size="sm">Go to Groups</Button>
                </Link>
              </div>
            ) : (
              <Select
                value={selectedGroupId || ""}
                onValueChange={handleGroupSelect}
              >
                <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  {groups.map((group) => (
                    <SelectItem
                      key={group.id}
                      value={group.id}
                      className="dark:text-white dark:focus:bg-gray-700"
                    >
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Description - always visible */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("description")}
          </label>
          <Input
            placeholder={t("descriptionPlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        {/* Amount - always visible */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("amount")}
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 text-2xl font-bold pr-12 dark:text-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              ฿
            </span>
          </div>
        </div>

        {/* Who paid - show members when loaded */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("paidBy")}
          </label>
          {members.length > 0 ? (
            <div className="flex gap-3 flex-wrap">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidById(member.userId)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    paidById === member.userId
                      ? "bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {member.user.name.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-2">
              Select a group first
            </p>
          )}
        </div>

        {/* Split with - show members when loaded */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("splitWith")}
          </label>
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              variant={splitEqually ? "default" : "outline"}
              onClick={() => setSplitEqually(true)}
              className={`rounded-full ${
                splitEqually ? "bg-emerald-500 hover:bg-emerald-600" : ""
              }`}
            >
              {t("splitEqually")}
            </Button>
            <Button
              type="button"
              variant={!splitEqually ? "default" : "outline"}
              onClick={() => setSplitEqually(false)}
              className={`rounded-full ${
                !splitEqually ? "bg-emerald-500 hover:bg-emerald-600" : ""
              } dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}
            >
              {t("custom")}
            </Button>
          </div>
          {members.length > 0 ? (
            <>
              {splitEqually ? (
                /* Equal split - show member badges to select/deselect */
                <>
                  <div className="flex gap-2 flex-wrap">
                    {members.map((member) => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        onClick={() => toggleMember(member.userId)}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                          selectedMembers.includes(member.userId)
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {member.user.name}{" "}
                        {selectedMembers.includes(member.userId) ? "✓" : ""}
                      </Badge>
                    ))}
                  </div>
                  {amount && selectedMembers.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Each person pays:{" "}
                      <span className="font-semibold">
                        ฿
                        {(parseFloat(amount) / selectedMembers.length).toFixed(
                          2
                        )}
                      </span>
                    </p>
                  )}
                </>
              ) : (
                /* Custom split - show input for each member's amount */
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-gray-700 dark:text-gray-300 text-sm">
                        {member.user.name}
                      </span>
                      <div className="relative w-28">
                        <Input
                          type="number"
                          placeholder="0"
                          value={customAmounts[member.userId] || ""}
                          onChange={(e) => {
                            setCustomAmounts((prev) => ({
                              ...prev,
                              [member.userId]: e.target.value,
                            }));
                            // Auto-add to selected members if amount > 0
                            if (
                              parseFloat(e.target.value) > 0 &&
                              !selectedMembers.includes(member.userId)
                            ) {
                              setSelectedMembers((prev) => [
                                ...prev,
                                member.userId,
                              ]);
                            }
                          }}
                          className="h-10 rounded-lg bg-gray-50 dark:bg-gray-800 border-0 text-right pr-8 dark:text-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          ฿
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Total display */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total:
                    </span>
                    <span
                      className={`font-semibold ${
                        amount &&
                        Math.abs(
                          Object.values(customAmounts).reduce(
                            (sum, val) => sum + (parseFloat(val) || 0),
                            0
                          ) - parseFloat(amount)
                        ) < 0.01
                          ? "text-emerald-500"
                          : "text-orange-500"
                      }`}
                    >
                      ฿
                      {Object.values(customAmounts)
                        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                        .toFixed(2)}
                      {amount && (
                        <span className="text-gray-400 font-normal">
                          {" "}
                          / ฿{parseFloat(amount).toFixed(2)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Select a group first
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !selectedGroupId ||
            !title ||
            !amount ||
            !selectedMembers.length
          }
          className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold mt-4 disabled:opacity-50"
        >
          {submitting ? "Adding..." : t("submit")}
        </Button>
      </div>
    </div>
  );
}
