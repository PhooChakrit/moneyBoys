"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TransactionData } from "./useGroupDetail";

interface TransactionsSectionProps {
  transactions: TransactionData[];
  showAllTransactions: boolean;
  initialLimit: number;
  onToggleShowAll: () => void;
  onTransactionClick: (transaction: TransactionData) => void;
  t: (key: string) => string;
}

export function TransactionsSection({
  transactions,
  showAllTransactions,
  initialLimit,
  onToggleShowAll,
  onTransactionClick,
  t,
}: TransactionsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 px-5 lg:px-8 py-4 lg:py-6">
      <h3 className="text-gray-800 dark:text-white font-semibold mb-4">
        {t("transactions")}
      </h3>
      {transactions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {t("noExpenses")}
        </p>
      ) : (
        <div className="space-y-4">
          {(showAllTransactions
            ? transactions
            : transactions.slice(0, initialLimit)
          ).map((tx) => (
            <button
              key={tx.id}
              onClick={() => onTransactionClick(tx)}
              className="flex items-start justify-between py-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 mt-1">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm">
                    {tx.paidBy[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {tx.title}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(tx.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {tx.paidBy} paid
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  {tx.currency === "THB" ? "฿" : tx.currency}{" "}
                  {tx.amount.toFixed(2)}
                </p>
                <div className="flex -space-x-1 mt-1 justify-end">
                  {tx.participants.slice(0, 4).map((p, i) => (
                    <Avatar
                      key={i}
                      className="w-6 h-6 border border-white dark:border-gray-800"
                    >
                      <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-white">
                        {p}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {transactions.length > initialLimit && (
        <button
          onClick={onToggleShowAll}
          className="w-full text-center text-emerald-600 dark:text-emerald-400 font-medium py-3 mt-2 hover:underline"
        >
          {showAllTransactions
            ? t("showLess")
            : `${t("showAll")} (${transactions.length})`}
        </button>
      )}
    </div>
  );
}
