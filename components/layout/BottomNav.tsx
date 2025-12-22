"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  PlusIcon,
  CheckIcon,
  SettingsIcon,
} from "@/components/icons";
import { useTranslations } from "next-intl";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`;
    if (path === "" && pathname === `/${locale}`) return true;
    if (path !== "" && pathname.startsWith(fullPath)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-around px-6 pb-safe z-50">
      <Link
        href={`/${locale}`}
        className={`flex flex-col items-center gap-1 ${
          isActive("")
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <HomeIcon className="w-6 h-6" />
        <span className="text-xs font-medium">{t("home")}</span>
      </Link>

      <Link
        href={`/${locale}/groups`}
        className={`flex flex-col items-center gap-1 ${
          isActive("/groups")
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <UsersIcon className="w-6 h-6" />
        <span className="text-xs font-medium">{t("groups")}</span>
      </Link>

      <Link
        href={`/${locale}/add-expense`}
        className="w-14 h-14 -mt-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-600"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>

      <Link
        href={`/${locale}/settle`}
        className={`flex flex-col items-center gap-1 ${
          isActive("/settle")
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <CheckIcon className="w-6 h-6" />
        <span className="text-xs font-medium">{t("settle")}</span>
      </Link>

      <Link
        href={`/${locale}/settings`}
        className={`flex flex-col items-center gap-1 ${
          isActive("/settings")
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <SettingsIcon className="w-6 h-6" />
        <span className="text-xs font-medium">{t("settings")}</span>
      </Link>
    </div>
  );
}
