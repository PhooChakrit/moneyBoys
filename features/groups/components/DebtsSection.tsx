"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, ArrowRightIcon } from "@/components/icons";
import { MemberData, DebtData } from "./useGroupDetail";

interface DebtsSectionProps {
  debts: DebtData[];
  members: MemberData[];
  groupId: string;
  locale: string;
  onMemberClick: (member: MemberData) => void;
  t: (key: string) => string;
}

export function DebtsSection({
  debts,
  members,
  groupId,
  locale,
  onMemberClick,
  t,
}: DebtsSectionProps) {
  if (debts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 px-5 lg:px-8 py-8 text-center">
        <p className="text-4xl mb-2">🎉</p>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {t("allSettled")}
        </p>
        <Link
          href={`/${locale}/add-expense?groupId=${groupId}`}
          className="inline-block mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          Add Expense
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 px-5 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-800 dark:text-white font-semibold">
            {t("debts")}
          </h3>
          <Link
            href={`/${locale}/add-expense?groupId=${groupId}`}
            className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </Link>
        </div>

        {debts.map((debt, i) => {
          const fromMember = members.find((m) => m.id === debt.fromId);
          const toMember = members.find((m) => m.id === debt.toId);
          return (
            <div key={i} className="flex items-center justify-between py-3">
              {/* From person - clickable */}
              <button
                onClick={() => fromMember && onMemberClick(fromMember)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    {debt.from[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {debt.from}
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 font-bold">
                    ฿{debt.fromBalance.toFixed(2)}
                  </p>
                </div>
              </button>
              <div className="flex items-center">
                <ArrowRightIcon className="w-5 h-5 text-gray-400 mx-4" />
              </div>
              {/* To person - clickable */}
              <button
                onClick={() => toMember && onMemberClick(toMember)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-right"
              >
                <div className="text-right">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {debt.to}
                  </p>
                </div>
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {debt.to[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          );
        })}
      </div>

      <Separator className="dark:bg-gray-700" />
    </>
  );
}
