import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UsersIcon } from "@/components/icons";
import { useTranslations } from "next-intl";
import { DashboardGroup } from "./useHome";

interface RecentGroupsProps {
  groups: DashboardGroup[] | undefined;
  loading: boolean;
  locale: string;
  formatCurrency: (amount: number) => string;
}

export function RecentGroups({
  groups,
  loading,
  locale,
  formatCurrency,
}: RecentGroupsProps) {
  const t = useTranslations("home");

  return (
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
      ) : groups && groups.length > 0 ? (
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
  );
}
