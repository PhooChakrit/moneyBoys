import { BellIcon } from "@/components/icons";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { useTranslations } from "next-intl";

interface HomeHeaderProps {
  user: {
    name: string;
    avatar: string | null;
  } | null;
  loading: boolean;
}

export function HomeHeader({ user, loading }: HomeHeaderProps) {
  const t = useTranslations("home");

  return (
    <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("greeting")}
          </p>
          {loading ? (
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {user?.name || "Welcome"} 👋
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <AvatarDisplay
            avatarKey={user?.avatar}
            name={user?.name || "Guest"}
            size="md"
            className="border-2 border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
