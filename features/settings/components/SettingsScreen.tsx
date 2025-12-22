"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ChevronRightIcon } from "@/components/icons";

export function SettingsScreen() {
  const t = useTranslations("settings");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale as string;

  const switchLocale = (newLocale: string) => {
    // Replace current locale in pathname with new locale
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  const settingsItems = [
    { icon: "🌙", label: t("theme"), value: t("light") },
    { icon: "🔗", label: t("inviteFriends"), value: "" },
    { icon: "🔒", label: t("groupPermissions"), value: "" },
    { icon: "📜", label: t("expenseHistory"), value: "" },
    { icon: "💳", label: t("paymentHistory"), value: "" },
    { icon: "👤", label: t("account"), value: "" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* Profile Card */}
      <div className="px-5 lg:px-8 mb-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700">
                  P
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-gray-800 text-lg">Pim Srisawat</p>
                <p className="text-gray-500">pim@email.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Switcher */}
      <div className="px-5 lg:px-8 mb-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <span className="text-gray-800">{t("language")}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => switchLocale("th")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    locale === "th"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  🇹🇭 ไทย
                </button>
                <button
                  onClick={() => switchLocale("en")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    locale === "en"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {settingsItems.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-gray-800">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-gray-500 text-sm">
                        {item.value}
                      </span>
                    )}
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {i < 5 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        <button className="w-full mt-5 p-4 text-red-500 font-medium text-center hover:bg-red-50 rounded-lg transition-colors">
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
