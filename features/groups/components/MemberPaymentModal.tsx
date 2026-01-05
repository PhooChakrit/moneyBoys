"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MemberData } from "./useGroupDetail";

interface MemberPaymentModalProps {
  member: MemberData | null;
  onClose: () => void;
  t: (key: string) => string;
}

export function MemberPaymentModal({
  member,
  onClose,
  t,
}: MemberPaymentModalProps) {
  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{member?.name}</DialogTitle>
        </DialogHeader>
        {member && (
          <div className="pt-4 space-y-4">
            {/* Balance Display */}
            <div
              className={`p-4 rounded-xl text-center ${
                member.balance < 0
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : member.balance > 0
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {member.balance < 0
                  ? "Owes the group"
                  : member.balance > 0
                    ? "Is owed"
                    : "Balance"}
              </p>
              <p
                className={`text-3xl font-bold ${
                  member.balance < 0
                    ? "text-amber-600 dark:text-amber-400"
                    : member.balance > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-400"
                }`}
              >
                ฿{Math.abs(member.balance).toFixed(2)}
              </p>
            </div>

            {/* Member Info */}
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("role")}
                </span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {member.role === "admin" ? t("admin") : t("member")}
                </span>
              </div>
              {member.email && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    Email
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {member.email}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {(member.bankName || member.bankAccount || member.qrCodeUrl) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </p>
                {member.bankName && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Bank
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white text-sm">
                      {member.bankName}
                    </span>
                  </div>
                )}
                {member.bankAccount && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Account
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">
                      {member.bankAccount}
                    </span>
                  </div>
                )}
                {member.qrCodeUrl && (
                  <div className="mt-3">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                      QR Code
                    </p>
                    <div className="bg-white rounded-lg p-2 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/image-proxy?key=${encodeURIComponent(member.qrCodeUrl)}`}
                        alt="Payment QR Code"
                        className="max-w-[180px] max-h-[180px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Payment Method */}
            {!member.bankName && !member.bankAccount && !member.qrCodeUrl && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No payment method set
                </p>
              </div>
            )}

            {/* Status Message */}
            {member.balance === 0 && (
              <div className="text-center py-4">
                <span className="text-2xl">✅</span>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t("allSettled")}
                </p>
              </div>
            )}

            {/* Close Button */}
            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
