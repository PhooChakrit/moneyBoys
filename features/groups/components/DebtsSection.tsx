"use client";

import Link from "next/link";
import { AvatarDisplay } from "@/components/ui/avatar-display";
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
            <div key={i} className="flex items-center py-3">
              {/* From person - clickable */}
              <button
                onClick={() => fromMember && onMemberClick(fromMember)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left flex-1 min-w-0"
              >
                <AvatarDisplay
                  avatarKey={fromMember?.avatar}
                  name={debt.from}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">
                    {debt.from}
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 font-bold">
                    ฿{debt.fromBalance.toFixed(2)}
                  </p>
                </div>
              </button>
              {/* Arrow - fixed center */}
              <div className="shrink-0 px-3">
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </div>
              {/* To person - clickable */}
              <button
                onClick={() => toMember && onMemberClick(toMember)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0 justify-end"
              >
                <div className="text-right min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">
                    {debt.to}
                  </p>
                </div>
                <AvatarDisplay
                  avatarKey={toMember?.avatar}
                  name={debt.to}
                  size="md"
                />
              </button>
            </div>
          );
        })}
      </div>

      <Separator className="dark:bg-gray-700" />
    </>
  );
}
