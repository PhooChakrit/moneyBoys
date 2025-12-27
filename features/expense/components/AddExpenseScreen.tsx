"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export function AddExpenseScreen() {
  const t = useTranslations("addExpense");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const groupId = searchParams.get("groupId");
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch group members
  useEffect(() => {
    if (!groupId) return;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members);
          // Default: current user paid, all members split
          if (user) {
            setPaidById(user.id);
            setSelectedMembers(data.members.map((m: GroupMember) => m.userId));
          }
        }
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId, user]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    if (!title || !amount || !paidById || !selectedMembers.length || !groupId) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const splits = selectedMembers.map((userId) => ({
        userId,
        share: 1, // Equal split for now
      }));

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
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
      router.push(`/${locale}/groups/${groupId}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!groupId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Please select a group first
          </p>
          <Link href={`/${locale}/groups`}>
            <Button>Go to Groups</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/groups/${groupId}`}
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

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("paidBy")}
          </label>
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
        </div>

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
                ฿{(parseFloat(amount) / selectedMembers.length).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !title || !amount || !selectedMembers.length}
          className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold mt-4"
        >
          {submitting ? "Adding..." : t("submit")}
        </Button>
      </div>
    </div>
  );
}
