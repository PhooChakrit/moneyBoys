"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionData } from "./useGroupDetail";

interface TransactionDetailModalProps {
  transaction: TransactionData | null;
  groupId: string;
  locale: string;
  deletingTransaction: boolean;
  onClose: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}

export function TransactionDetailModal({
  transaction,
  groupId,
  locale,
  deletingTransaction,
  onClose,
  onDelete,
  t,
}: TransactionDetailModalProps) {
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {transaction?.title}
          </DialogTitle>
        </DialogHeader>
        {transaction && (
          <div className="pt-4 space-y-4">
            {/* Amount */}
            <div className="p-4 rounded-xl text-center bg-amber-100 dark:bg-amber-900/30">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Amount
              </p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {transaction.currency === "THB" ? "฿" : transaction.currency}
                {transaction.amount.toFixed(2)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">
                  Paid by
                </span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {transaction.paidBy}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {new Date(transaction.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">
                  Participants
                </span>
                <div className="flex -space-x-1">
                  {transaction.participants.map((p, i) => (
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
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <Link
                href={`/${locale}/add-expense?groupId=${groupId}&editId=${transaction.id}`}
                onClick={onClose}
              >
                <div className="py-2">
                  <Button
                    variant="outline"
                    className="w-full dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 "
                  >
                    {t("editExpense")}
                  </Button>
                </div>
              </Link>
              <Button
                variant="outline"
                onClick={onDelete}
                disabled={deletingTransaction}
                className="w-full text-red-500 dark:text-red-400 border-red-500 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                {deletingTransaction ? t("deleting") : t("deleteExpense")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
