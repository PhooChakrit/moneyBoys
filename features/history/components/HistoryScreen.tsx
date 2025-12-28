"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface TimelineItem {
  type: "expense" | "settlement";
  id: string;
  date: string;
  amount: number;
  groupId: string;
  groupName: string;
  // Expense specific
  title?: string;
  paidBy?: string;
  paidById?: string;
  paidByAvatar?: string | null;
  participants?: string[];
  isUserPayer?: boolean;
  userShare?: number;
  // Settlement specific
  status?: string;
  fromUser?: string;
  fromUserId?: string;
  fromUserAvatar?: string | null;
  toUser?: string;
  toUserId?: string;
  toUserAvatar?: string | null;
  isUserReceiver?: boolean;
}

export function HistoryScreen() {
  const t = useTranslations("history");
  const params = useParams();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [filter, setFilter] = useState<"all" | "expenses" | "settlements">(
    "all",
  );

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const filteredTimeline = timeline.filter((item) => {
    if (filter === "all") return true;
    if (filter === "expenses") return item.type === "expense";
    return item.type === "settlement";
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title") || "History"}
          </h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 lg:px-8 mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t("all") || "All"}
          </button>
          <button
            onClick={() => setFilter("expenses")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "expenses"
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t("expenses") || "Expenses"}
          </button>
          <button
            onClick={() => setFilter("settlements")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "settlements"
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {t("settlements") || "Settlements"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 lg:px-8 space-y-3">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📜</p>
            <p className="text-gray-500 dark:text-gray-400">
              {t("noHistory") || "No history yet"}
            </p>
          </div>
        ) : (
          filteredTimeline.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm dark:bg-gray-800">
              <CardContent className="p-4">
                {item.type === "expense" ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback
                          className={`${item.isUserPayer ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                        >
                          {item.paidBy?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.paidBy} paid • {item.groupName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        ฿{item.amount.toFixed(2)}
                      </p>
                      {item.userShare && item.userShare > 0 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          Your share: ฿{item.userShare.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={`text-sm ${item.isUserPayer ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                          >
                            {item.fromUser?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={`text-sm ${item.isUserReceiver ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                          >
                            {item.toUser?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.fromUser} → {item.toUser}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.groupName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        ฿{item.amount.toFixed(2)}
                      </p>
                      <Badge
                        className={
                          item.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        }
                      >
                        {item.status === "completed" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
