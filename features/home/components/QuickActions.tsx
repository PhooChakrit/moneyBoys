import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  UsersIcon,
  ReceiptIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/icons";
import { useTranslations } from "next-intl";

interface QuickActionsProps {
  locale: string;
}

export function QuickActions({ locale }: QuickActionsProps) {
  const t = useTranslations("home");

  return (
    <div className="px-5 lg:px-8 mt-6">
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

        <Link href={`/${locale}/history`}>
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
        </Link>
      </div>
    </div>
  );
}
