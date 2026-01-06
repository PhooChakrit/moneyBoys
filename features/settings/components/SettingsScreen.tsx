"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { Separator } from "@/components/ui/separator";
import { ChevronRightIcon } from "@/components/icons";
import { useSettings } from "./useSettings";

export function SettingsScreen() {
  const {
    t,
    locale,
    user,
    theme,
    setTheme,
    mounted,
    handleLogout,
    switchLocale,
    navigateToItem,
    settingsItems,
  } = useSettings();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
      </div>

      {/* Profile Card */}
      <div className="px-5 lg:px-8 mb-5">
        <Card className="border-0 shadow-sm dark:bg-gray-800 dark:text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <AvatarDisplay
                avatarKey={user?.avatar}
                name={user?.name || "Guest"}
                size="lg"
              />
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-lg">
                  {user?.name || "Guest"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {user?.email || "Not logged in"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Theme Switcher */}
      <div className="px-5 lg:px-8 mb-5">
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌙</span>
                <span className="text-gray-800 dark:text-white">
                  {t("theme")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mounted && theme === "light"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  ☀️ {t("light")}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mounted && theme === "dark"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  🌙 {t("dark")}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Switcher */}
      <div className="px-5 lg:px-8 mb-5">
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <span className="text-gray-800 dark:text-white">
                  {t("language")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchLocale("th")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    locale === "th"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  🇹🇭 ไทย
                </button>
                <button
                  onClick={() => switchLocale("en")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    locale === "en"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings List */}
      <div className="px-5 lg:px-8">
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-0">
            {settingsItems.map((item, i) => (
              <div key={i}>
                <div
                  onClick={() => navigateToItem(item.href)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-gray-800 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.value}
                      </span>
                    )}
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {i < 4 && <Separator className="dark:bg-gray-700" />}
              </div>
            ))}
          </CardContent>
        </Card>

        <button
          onClick={handleLogout}
          className="w-full mt-5 p-4 text-red-500 font-medium text-center hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
