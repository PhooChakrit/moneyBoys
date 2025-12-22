"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "@/components/icons";

export function AddExpenseScreen() {
  const t = useTranslations("addExpense");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("description")}
          </label>
          <Input
            placeholder={t("descriptionPlaceholder")}
            className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("amount")}
          </label>
          <div className="relative">
            <Input
              placeholder="0"
              className="h-14 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 text-2xl font-bold pr-12 dark:text-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              ฿
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("paidBy")}
          </label>
          <div className="flex gap-3">
            {["P", "B", "N", "S"].map((a, i) => (
              <button
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i === 0
                    ? "bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("splitWith")}
          </label>
          <div className="flex gap-2 mb-3">
            <Button
              variant="default"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600"
            >
              {t("splitEqually")}
            </Button>
            <Button
              variant="outline"
              className="rounded-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("custom")}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Pim", "Bank", "Nook", "Som"].map((name, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300"
              >
                {name} ✓
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("receipt")}
          </label>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
            <span className="text-3xl">📷</span>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {t("tapToPhoto")}
            </p>
          </div>
        </div>

        <Button className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold mt-4">
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}
