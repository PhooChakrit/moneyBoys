"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeftIcon,
  PlusIcon,
  ArrowRightIcon,
  MoreIcon,
} from "@/components/icons";
import { QRCodeSVG } from "qrcode.react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MemberData {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: string;
  balance: number;
  initials: string;
}

interface TransactionData {
  id: string;
  title: string;
  amount: number;
  currency: string;
  paidBy: string;
  paidById: string;
  date: string;
  participants: string[];
}

interface DebtData {
  from: string;
  fromId: string;
  fromBalance: number;
  to: string;
  toId: string;
}

interface GroupData {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  memberCount: number;
  expenseCount: number;
  role: string;
}

interface GroupDetailScreenProps {
  groupId: string;
}

export function GroupDetailScreen({ groupId }: GroupDetailScreenProps) {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [debts, setDebts] = useState<DebtData[]>([]);

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Fetch group data
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch group");
        }
        const data = await res.json();
        setGroup(data.group);
        setMembers(data.members || []);
        setTransactions(data.transactions || []);
        setDebts(data.debts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  // Copy invite link
  const copyInviteLink = () => {
    const link = `${window.location.origin}/${locale}/groups/join?code=${group?.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy invite code
  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Bubble size based on balance magnitude
  const getBubbleSize = (balance: number, maxBalance: number) => {
    const ratio = Math.abs(balance) / (maxBalance || 1);
    if (ratio > 0.6) return "w-28 h-28";
    if (ratio > 0.3) return "w-20 h-20";
    return "w-14 h-14";
  };

  // Bubble positions
  const bubblePositions = [
    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
    "top-[20%] left-[15%] -translate-x-1/2 -translate-y-1/2",
    "bottom-[25%] left-[20%] -translate-x-1/2 -translate-y-1/2",
    "top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-[25%] right-[10%] -translate-x-1/2 -translate-y-1/2",
    "bottom-[20%] right-[15%] -translate-x-1/2 -translate-y-1/2",
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex flex-col items-center justify-center p-8">
        <p className="text-red-500 mb-4">{error || "Group not found"}</p>
        <Link
          href={`/${locale}/groups`}
          className="text-emerald-500 hover:underline"
        >
          ← Back to Groups
        </Link>
      </div>
    );
  }

  const maxBalance = Math.max(...members.map((m) => Math.abs(m.balance)), 1);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/${locale}/groups`}
            className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
          </Link>

          {/* More options */}
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center">
                <MoreIcon className="w-5 h-5 text-gray-300" />
              </button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  Invite Members
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Invite Code */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invite Code
                  </label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={group.inviteCode}
                      readOnly
                      className="text-center text-2xl tracking-widest font-mono dark:bg-gray-700 dark:text-white"
                    />
                    <Button onClick={copyInviteCode} variant="outline">
                      {copied ? "✓" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Invite Link */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Invite Link
                  </label>
                  <Button
                    onClick={copyInviteLink}
                    className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600"
                  >
                    {copied ? "Link Copied!" : "Copy Invite Link"}
                  </Button>
                </div>

                {/* QR Code */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    QR Code
                  </label>
                  <div className="mt-2 p-4 bg-white rounded-lg flex items-center justify-center">
                    <QRCodeSVG
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/groups/join?code=${group.inviteCode}`}
                      size={160}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Leave Group */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInviteDialogOpen(false);
                      setShowLeaveConfirm(true);
                    }}
                    className="w-full text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Leave Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bubble Visualization */}
        <div className="relative h-72 mb-4">
          {members.slice(0, 6).map((member, i) => (
            <div
              key={member.id}
              className={`absolute ${bubblePositions[i] || bubblePositions[0]} transition-all duration-300`}
            >
              <div
                className={`${getBubbleSize(member.balance, maxBalance)} rounded-full flex flex-col items-center justify-center ${
                  member.balance < 0
                    ? "bg-amber-700/80"
                    : member.balance > 0
                      ? "bg-emerald-700/60"
                      : "bg-gray-600/60"
                }`}
              >
                <span className="text-white/90 text-xs font-medium truncate max-w-[80%]">
                  {member.name}
                </span>
                <span className="text-sm font-bold text-white">
                  {member.balance < 0 ? "" : member.balance > 0 ? "+" : ""}
                  {member.balance === 0
                    ? "฿0.00"
                    : `฿${Math.abs(member.balance).toFixed(2)}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        {members.length > 6 && (
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: Math.ceil(members.length / 6) }).map(
              (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === 0 ? "bg-white" : "bg-gray-600"
                  }`}
                />
              ),
            )}
          </div>
        )}

        {/* Group name */}
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg font-medium">{group.name}</span>
          <button
            onClick={() => setInviteDialogOpen(true)}
            className="text-sm text-gray-300 hover:text-white underline"
          >
            Invite / Settings
          </button>
        </div>
      </div>

      {/* Debts Section - Now right after bubble */}
      {debts.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 px-5 lg:px-8 py-4 lg:py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-800 dark:text-white font-semibold">
                Debts
              </h3>
              <Link
                href={`/${locale}/add-expense?groupId=${groupId}`}
                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
              >
                <PlusIcon className="w-5 h-5 text-white" />
              </Link>
            </div>

            {debts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
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
                </div>
                <div className="flex items-center">
                  <ArrowRightIcon className="w-5 h-5 text-gray-400 mx-4" />
                </div>
                <div className="flex items-center gap-3">
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
                </div>
              </div>
            ))}
          </div>

          <Separator className="dark:bg-gray-700" />
        </>
      )}

      {/* All Settled Message */}
      {debts.length === 0 && (
        <div className="bg-white dark:bg-gray-800 px-5 lg:px-8 py-8 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            All settled up!
          </p>
          <Link
            href={`/${locale}/add-expense?groupId=${groupId}`}
            className="inline-block mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Add Expense
          </Link>
        </div>
      )}

      <Separator className="dark:bg-gray-700" />

      {/* Transactions Section */}
      <div className="bg-white dark:bg-gray-800 px-5 lg:px-8 py-4 lg:py-6">
        <h3 className="text-gray-800 dark:text-white font-semibold mb-4">
          Transactions
        </h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No expenses yet
          </p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-start justify-between py-2"
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
              </div>
            ))}
          </div>
        )}

        {transactions.length > 0 && (
          <button className="w-full text-center text-emerald-600 dark:text-emerald-400 font-medium py-3 mt-2">
            Show all
          </button>
        )}
      </div>

      {/* Leave Group Confirmation Dialog */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Leave Group</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to leave <strong>{group.name}</strong>? You
              will need to be invited again to rejoin.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1"
                disabled={leaving}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setLeaving(true);
                  try {
                    const res = await fetch(
                      `/api/groups/${groupId}/members?memberId=self`,
                      { method: "DELETE" },
                    );
                    if (res.ok) {
                      router.push(`/${locale}/groups`);
                    } else {
                      const data = await res.json();
                      alert(data.error || "Failed to leave group");
                    }
                  } catch {
                    alert("Failed to leave group");
                  } finally {
                    setLeaving(false);
                    setShowLeaveConfirm(false);
                  }
                }}
                disabled={leaving}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {leaving ? "Leaving..." : "Leave Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
