"use client";

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
import { groups } from "@/lib/data";

export function HomeScreen() {
  const t = useTranslations("home");
  const params = useParams();
  const locale = params.locale as string;

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
              {t("userName")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <Avatar className="w-10 h-10 border-2 border-emerald-500">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                P
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mt-6 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-emerald-100 text-sm">{t("balanceTitle")}</p>
            <h2 className="text-3xl font-bold text-white mt-1">
              {t("balanceAmount")}
            </h2>
            <p className="text-emerald-200 text-sm mt-2">
              {t("balanceSubtitle")}
            </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.slice(0, 3).map((group) => (
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
                    {group.balance > 0 ? "+" : ""}
                    {group.balance.toLocaleString()}฿
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
