"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BellIcon,
  UsersIcon,
  ReceiptIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/icons";
import { useAuth } from "@/features/auth/context/AuthContext";

interface DashboardGroup {
  id: string;
  name: string;
  members: number;
  balance: number;
  avatars: string[];
  role: string;
}

interface DashboardData {
  groups: DashboardGroup[];
  summary: {
    totalBalance: number;
    youAreOwed: number;
    youOwe: number;
    netBalance: number;
  };
}

export function HomeScreen() {
  const t = useTranslations("home");
  const params = useParams();
  const locale = params.locale as string;
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React strict mode
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount.toLocaleString()}฿`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t("greeting")}
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {user?.name || t("userName")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <Avatar className="w-10 h-10 border-2 border-emerald-500">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mt-6 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-emerald-100 text-sm">{t("balanceTitle")}</p>
            {loading ? (
              <div className="h-10 bg-emerald-400/30 rounded animate-pulse mt-1 w-32" />
            ) : (
              <>
                <h2 className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(dashboardData?.summary?.totalBalance || 0)}
                </h2>
                <p className="text-emerald-200 text-sm mt-2">
                  {dashboardData?.summary?.youOwe
                    ? `${t("youOweToPay")} ${dashboardData.summary.youOwe.toLocaleString()}฿`
                    : t("allSettled")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-5 lg:px-8">
        <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">
          {t("quickActions")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
          <Link href={`/${locale}/groups`}>
            <Card className="bg-[#E0F2FE] dark:bg-blue-900/30 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                  <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {t("createGroup")}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {t("createGroupDesc")}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/add-expense`}>
            <Card className="bg-[#D1FAE5] dark:bg-emerald-900/30 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                  <ReceiptIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {t("addExpense")}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {t("addExpenseDesc")}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/settle`}>
            <Card className="bg-[#FED7AA] dark:bg-orange-900/30 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-3">
                  <CheckIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {t("settle")}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {t("settleDesc")}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-[#F3F4F6] dark:bg-gray-800 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center mb-3">
                <ClockIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {t("history")}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {t("historyDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Groups */}
      <div className="px-5 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            {t("recentGroups")}
          </p>
          <Link
            href={`/${locale}/groups`}
            className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            {t("viewAll")}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="border-0 shadow-sm dark:bg-gray-800 animate-pulse"
              >
                <CardContent className="p-4">
                  <div className="flex -space-x-2 mb-3">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"
                      />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dashboardData?.groups && dashboardData.groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.groups.slice(0, 3).map((group) => (
              <Link key={group.id} href={`/${locale}/groups/${group.id}`}>
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex -space-x-2 mb-3">
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
                    </div>
                    <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                      {group.name}
                    </p>
                    <p
                      className={`text-sm mt-1 font-semibold ${
                        group.balance > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : group.balance < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {formatCurrency(group.balance)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {t("noGroups") || "No groups yet"}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {t("noGroupsDesc") ||
                  "Create a group to start splitting expenses"}
              </p>
              <Link
                href={`/${locale}/groups`}
                className="inline-block mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {t("createGroup")}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
