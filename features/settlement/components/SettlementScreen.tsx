"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { settlements } from "@/lib/data";

export function SettlementScreen() {
  const t = useTranslations("settlement");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 lg:px-8 mb-5">
        <Card className="bg-[#E0F2FE] border-0">
          <CardContent className="p-4">
            <p className="text-blue-700 text-sm">{t("totalToPay")}</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">680฿</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements List */}
      <div className="px-5 lg:px-8 space-y-3">
        {settlements.map((item) => (
          <Card key={item.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="text-sm bg-gray-100">
                        {item.from[0]}
                      </AvatarFallback>
                    </Avatar>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="text-sm bg-emerald-100 text-emerald-700">
                        {item.to[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.from} → {item.to}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {item.amount}฿
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={item.status === "paid" ? "default" : "secondary"}
                    className={
                      item.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                    }
                  >
                    {item.status === "paid" ? t("paid") : t("pending")}
                  </Badge>
                  {item.status === "pending" && (
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8"
                    >
                      {t("markPaid")}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
