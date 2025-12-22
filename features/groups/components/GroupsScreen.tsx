"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusIcon, ChevronRightIcon } from "@/components/icons";
import { groups } from "@/lib/data";

export function GroupsScreen() {
  const t = useTranslations("groups");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              P
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="px-5 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Link key={group.id} href={`/${locale}/groups/${group.id}`}>
              <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {group.avatars.slice(0, 3).map((a, i) => (
                          <Avatar
                            key={i}
                            className="w-8 h-8 border-2 border-white"
                          >
                            <AvatarFallback className="text-xs bg-gray-100">
                              {a}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {group.members > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                            +{group.members - 3}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {group.name}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {group.members} {t("peopleCount")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          group.balance > 0
                            ? "text-emerald-600"
                            : group.balance < 0
                              ? "text-red-500"
                              : "text-gray-400"
                        }`}
                      >
                        {group.balance > 0 ? "+" : ""}
                        {group.balance.toLocaleString()}฿
                      </p>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors lg:bottom-8">
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
