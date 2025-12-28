"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Debt {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatar: string | null;
  amount: number;
  groupId: string;
  groupName: string;
}

interface PendingSettlement {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  fromUser: { id: string; name: string; avatar: string | null };
  toUser: { id: string; name: string; avatar: string | null };
  group: { id: string; name: string };
}

export function SettlementScreen() {
  const t = useTranslations("settlement");
  const params = useParams();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [youOwe, setYouOwe] = useState<Debt[]>([]);
  const [owedToYou, setOwedToYou] = useState<Debt[]>([]);
  const [totalYouOwe, setTotalYouOwe] = useState(0);
  const [totalOwedToYou, setTotalOwedToYou] = useState(0);
  const [pendingConfirmations, setPendingConfirmations] = useState<
    PendingSettlement[]
  >([]);
  const [myPendingPayments, setMyPendingPayments] = useState<
    PendingSettlement[]
  >([]);
  const [settling, setSettling] = useState<Debt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const res = await fetch("/api/settlements");
      if (res.ok) {
        const data = await res.json();
        setYouOwe(data.youOwe || []);
        setOwedToYou(data.owedToYou || []);
        setTotalYouOwe(data.totalYouOwe || 0);
        setTotalOwedToYou(data.totalOwedToYou || 0);
        setPendingConfirmations(data.pendingConfirmations || []);
        setMyPendingPayments(data.myPendingPayments || []);
      }
    } catch (err) {
      console.error("Failed to fetch debts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (debt: Debt) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: debt.toUserId,
          amount: debt.amount,
          groupId: debt.groupId,
          note: `Settled debt from ${debt.groupName}`,
        }),
      });

      if (res.ok) {
        await fetchDebts();
        setSettling(null);
      }
    } catch (err) {
      console.error("Failed to settle:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async (
    settlementId: string,
    action: "confirm" | "reject",
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId, action }),
      });

      if (res.ok) {
        await fetchDebts();
      }
    } catch (err) {
      console.error("Failed to update settlement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const netBalance = totalOwedToYou - totalYouOwe;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-5 lg:px-8 mb-5 grid grid-cols-2 gap-3">
        <Card
          className={`border-0 ${netBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-amber-50 dark:bg-amber-900/30"}`}
        >
          <CardContent className="p-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Net Balance
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {netBalance >= 0 ? "+" : ""}
              {netBalance.toFixed(2)}฿
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/30 border-0">
          <CardContent className="p-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t("totalToPay")}
            </p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">
              {totalYouOwe.toFixed(2)}฿
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations (needs your approval) */}
      {pendingConfirmations.length > 0 && (
        <div className="px-5 lg:px-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Confirm Payments 🔔
          </h2>
          <div className="space-y-3">
            {pendingConfirmations.map((settlement) => (
              <Card
                key={settlement.id}
                className="border-2 border-amber-300 dark:border-amber-600 shadow-sm dark:bg-gray-800"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          {settlement.fromUser.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {settlement.fromUser.name} paid you
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {settlement.group.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {settlement.amount.toFixed(2)}฿
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleConfirmPayment(settlement.id, "reject")
                      }
                      disabled={submitting}
                      className="flex-1 text-red-500 border-red-300 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleConfirmPayment(settlement.id, "confirm")
                      }
                      disabled={submitting}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Confirm Received
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Pending Payments (awaiting confirmation) */}
      {myPendingPayments.length > 0 && (
        <div className="px-5 lg:px-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Awaiting Confirmation ⏳
          </h2>
          <div className="space-y-3">
            {myPendingPayments.map((settlement) => (
              <Card
                key={settlement.id}
                className="border-0 shadow-sm dark:bg-gray-800 opacity-75"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {settlement.toUser.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          To {settlement.toUser.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {settlement.group.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-600 dark:text-gray-300">
                        {settlement.amount.toFixed(2)}฿
                      </p>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        Pending
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* You Owe Section */}
      {youOwe.length > 0 && (
        <div className="px-5 lg:px-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            You Owe 💸
          </h2>
          <div className="space-y-3">
            {youOwe.map((debt, i) => (
              <Card key={i} className="border-0 shadow-sm dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          {debt.toUserName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {debt.toUserName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {debt.groupName}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {debt.amount.toFixed(2)}฿
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setSettling(debt)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8"
                      >
                        {t("markPaid")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Owed To You Section */}
      {owedToYou.length > 0 && (
        <div className="px-5 lg:px-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Owed To You 💰
          </h2>
          <div className="space-y-3">
            {owedToYou.map((debt, i) => (
              <Card key={i} className="border-0 shadow-sm dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          {debt.fromUserName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {debt.fromUserName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {debt.groupName}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {debt.amount.toFixed(2)}฿
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {youOwe.length === 0 &&
        owedToYou.length === 0 &&
        pendingConfirmations.length === 0 &&
        myPendingPayments.length === 0 && (
          <div className="px-5 lg:px-8 text-center py-12">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-gray-500 dark:text-gray-400">
              All settled up! No debts to pay.
            </p>
          </div>
        )}

      {/* Settle Confirmation Dialog */}
      <Dialog open={!!settling} onOpenChange={() => setSettling(null)}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Confirm Payment
            </DialogTitle>
          </DialogHeader>
          {settling && (
            <div className="pt-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-lg">
                      You
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    You
                  </p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <Avatar className="w-14 h-14 mx-auto mb-2">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-lg">
                      {settling.toUserName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {settling.toUserName}
                  </p>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {settling.amount.toFixed(2)}฿
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  from {settling.groupName}
                </p>
              </div>

              <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-4 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                ⚠️ {settling.toUserName} will need to confirm they received this
                payment
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSettling(null)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSettle(settling)}
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {submitting ? "Processing..." : "I Paid"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
