"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  UserPlusIcon,
  SettingsIcon,
  XIcon,
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
  bankName?: string | null;
  bankAccount?: string | null;
  qrCodeUrl?: string | null;
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
  const t = useTranslations("groupDetail");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [debts, setDebts] = useState<DebtData[]>([]);

  // Dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Admin editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // Transaction display
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const INITIAL_TRANSACTIONS_LIMIT = 3;

  // Member payment modal
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);

  // Transaction modal
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionData | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);

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

  // Start editing mode
  const startEditing = () => {
    if (group) {
      setEditName(group.name);
      setEditDescription(group.description || "");
      setIsEditing(true);
    }
  };

  // Save group changes
  const saveGroupChanges = async () => {
    if (!group) return;
    setSavingGroup(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroup({
          ...group,
          name: data.group.name,
          description: data.group.description,
        });
        setIsEditing(false);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update group");
      }
    } catch {
      alert("Failed to update group");
    } finally {
      setSavingGroup(false);
    }
  };

  // Remove a member (admin only)
  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setRemovingMember(memberId);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/members?memberId=${memberId}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch {
      alert("Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    if (
      !confirm(
        "Are you sure you want to delete this expense? This cannot be undone."
      )
    )
      return;

    setDeletingTransaction(true);
    try {
      const res = await fetch(`/api/expenses/${selectedTransaction.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Remove from local state
        setTransactions(
          transactions.filter((t) => t.id !== selectedTransaction.id)
        );
        setSelectedTransaction(null);
        // Refetch to update balances
        const groupRes = await fetch(`/api/groups/${groupId}`);
        if (groupRes.ok) {
          const data = await groupRes.json();
          setMembers(data.members || []);
          setDebts(data.debts || []);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete expense");
      }
    } catch {
      alert("Failed to delete expense");
    } finally {
      setDeletingTransaction(false);
    }
  };

  // Copy invite code
  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Bubble size based on balance magnitude - 5 size levels
  const getBubbleSize = (balance: number, maxBalance: number) => {
    const ratio = Math.abs(balance) / (maxBalance || 1);
    if (ratio > 0.8) return { class: "w-32 h-32", px: 128 }; // XL
    if (ratio > 0.6) return { class: "w-24 h-24", px: 96 }; // L
    if (ratio > 0.4) return { class: "w-20 h-20", px: 80 }; // M
    if (ratio > 0.2) return { class: "w-16 h-16", px: 64 }; // S
    return { class: "w-12 h-12", px: 48 }; // XS
  };

  // Calculate dynamic positions based on bubble sizes - returns inline style
  // Supports up to 12 members in a clustered arrangement
  const getBubblePosition = (index: number) => {
    // Position patterns - arranged in a cluster with overlapping
    const patterns = [
      { top: 50, left: 50 }, // 0: Center
      { top: 35, left: 65 }, // 1: Top-right
      { top: 65, left: 35 }, // 2: Bottom-left
      { top: 30, left: 35 }, // 3: Top-left
      { top: 70, left: 65 }, // 4: Bottom-right
      { top: 20, left: 50 }, // 5: Top center
      { top: 80, left: 50 }, // 6: Bottom center
      { top: 45, left: 20 }, // 7: Left
      { top: 45, left: 80 }, // 8: Right
      { top: 25, left: 75 }, // 9: Top-right corner
      { top: 75, left: 25 }, // 10: Bottom-left corner
      { top: 55, left: 35 }, // 11: Center-left
    ];

    const pos = patterns[index] || patterns[index % patterns.length];
    const zIndex = 12 - index;

    return {
      style: {
        top: `${pos.top}%`,
        left: `${pos.left}%`,
        transform: "translate(-50%, -50%)",
        zIndex,
      },
    };
  };

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

          {/* Header buttons */}
          <div className="flex items-center gap-2">
            {/* Invite button */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <UserPlusIcon className="w-5 h-5 text-gray-300" />
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
                </div>
              </DialogContent>
            </Dialog>

            {/* Settings button */}
            <Dialog
              open={settingsDialogOpen}
              onOpenChange={setSettingsDialogOpen}
            >
              <DialogTrigger asChild>
                <button className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <SettingsIcon className="w-5 h-5 text-gray-300" />
                </button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-800 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">
                    {t("groupSettings")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Group Info - Editable for admins */}
                  {group.role === "admin" && isEditing ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                          {t("groupName")}
                        </label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                          {t("description")}
                        </label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional description"
                          className="dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="flex-1"
                          disabled={savingGroup}
                        >
                          {t("cancel")}
                        </Button>
                        <Button
                          onClick={saveGroupChanges}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                          disabled={savingGroup || !editName.trim()}
                        >
                          {savingGroup ? t("saving") : t("save")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("groupName")}
                          </p>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {group.name}
                          </p>
                        </div>
                        {group.role === "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={startEditing}
                            className="dark:border-gray-600 dark:text-gray-300"
                          >
                            {t("edit")}
                          </Button>
                        )}
                      </div>
                      {group.description && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("description")}
                          </p>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {group.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Members List (Admin can remove) */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {t("members")} ({members.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white text-sm">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {member.role === "admin"
                                  ? t("admin")
                                  : t("member")}
                              </p>
                            </div>
                          </div>
                          {group.role === "admin" &&
                            member.role !== "admin" && (
                              <button
                                onClick={() => removeMember(member.id)}
                                disabled={removingMember === member.id}
                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                              >
                                {removingMember === member.id ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <XIcon className="w-4 h-4" />
                                )}
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave Group */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSettingsDialogOpen(false);
                        setShowLeaveConfirm(true);
                      }}
                      className="w-full text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {t("leaveGroup")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bubble Visualization */}
        <div className="flex justify-center mb-4">
          <div className="relative w-80 h-64">
            {members.slice(0, 12).map((member, i) => {
              const bubbleSize = getBubbleSize(member.balance, maxBalance);
              const position = getBubblePosition(i);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  style={position.style}
                  className="absolute transition-all duration-300 hover:scale-110 focus:outline-none"
                >
                  <div
                    className={`${bubbleSize.class} rounded-full flex flex-col items-center justify-center cursor-pointer shadow-lg ${
                      member.balance < 0
                        ? "bg-amber-700/80 hover:bg-amber-600/80"
                        : member.balance > 0
                          ? "bg-emerald-700/60 hover:bg-emerald-600/60"
                          : "bg-gray-600/60 hover:bg-gray-500/60"
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Pagination dots */}
        {members.length > 12 && (
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: Math.ceil(members.length / 12) }).map(
              (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === 0 ? "bg-white" : "bg-gray-600"
                  }`}
                />
              )
            )}
          </div>
        )}

        {/* Group name */}
        <div className="text-white">
          <span className="text-lg font-medium">{group.name}</span>
        </div>
      </div>

      {/* Debts Section - Now right after bubble */}
      {debts.length > 0 && (
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
                    onClick={() => fromMember && setSelectedMember(fromMember)}
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
                    onClick={() => toMember && setSelectedMember(toMember)}
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
      )}

      {/* All Settled Message */}
      {debts.length === 0 && (
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
      )}

      <Separator className="dark:bg-gray-700" />

      {/* Transactions Section */}
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
              : transactions.slice(0, INITIAL_TRANSACTIONS_LIMIT)
            ).map((tx) => (
              <button
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
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

        {transactions.length > INITIAL_TRANSACTIONS_LIMIT && (
          <button
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            className="w-full text-center text-emerald-600 dark:text-emerald-400 font-medium py-3 mt-2 hover:underline"
          >
            {showAllTransactions
              ? t("showLess")
              : `${t("showAll")} (${transactions.length})`}
          </button>
        )}
      </div>

      {/* Leave Group Confirmation Dialog */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {t("leaveGroup")}
            </DialogTitle>
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
                      { method: "DELETE" }
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
                {leaving ? t("leaving") : t("leaveGroup")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Payment Modal */}
      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="pt-4 space-y-4">
              {/* Balance Display */}
              <div
                className={`p-4 rounded-xl text-center ${
                  selectedMember.balance < 0
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : selectedMember.balance > 0
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {selectedMember.balance < 0
                    ? "Owes the group"
                    : selectedMember.balance > 0
                      ? "Is owed"
                      : "Balance"}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    selectedMember.balance < 0
                      ? "text-amber-600 dark:text-amber-400"
                      : selectedMember.balance > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  ฿{Math.abs(selectedMember.balance).toFixed(2)}
                </p>
              </div>

              {/* Member Info */}
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("role")}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {selectedMember.role === "admin" ? t("admin") : t("member")}
                  </span>
                </div>
                {selectedMember.email && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      Email
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {selectedMember.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              {(selectedMember.bankName ||
                selectedMember.bankAccount ||
                selectedMember.qrCodeUrl) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Payment Method
                  </p>
                  {selectedMember.bankName && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Bank
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white text-sm">
                        {selectedMember.bankName}
                      </span>
                    </div>
                  )}
                  {selectedMember.bankAccount && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        Account
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white text-sm font-mono">
                        {selectedMember.bankAccount}
                      </span>
                    </div>
                  )}
                  {selectedMember.qrCodeUrl && (
                    <div className="mt-3">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                        QR Code
                      </p>
                      <div className="bg-white rounded-lg p-2 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/image-proxy?key=${encodeURIComponent(selectedMember.qrCodeUrl)}`}
                          alt="Payment QR Code"
                          className="max-w-[180px] max-h-[180px] object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Payment Method */}
              {!selectedMember.bankName &&
                !selectedMember.bankAccount &&
                !selectedMember.qrCodeUrl && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No payment method set
                    </p>
                  </div>
                )}

              {/* Status Message */}
              {selectedMember.balance === 0 && (
                <div className="text-center py-4">
                  <span className="text-2xl">✅</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {t("allSettled")}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <Button
                onClick={() => setSelectedMember(null)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Modal */}
      <Dialog
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {selectedTransaction?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="pt-4 space-y-4">
              {/* Amount */}
              <div className="p-4 rounded-xl text-center bg-amber-100 dark:bg-amber-900/30">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Amount
                </p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {selectedTransaction.currency === "THB"
                    ? "฿"
                    : selectedTransaction.currency}
                  {selectedTransaction.amount.toFixed(2)}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    Paid by
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {selectedTransaction.paidBy}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">Date</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {new Date(selectedTransaction.date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    Participants
                  </span>
                  <div className="flex -space-x-1">
                    {selectedTransaction.participants.map((p, i) => (
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
                  href={`/${locale}/add-expense?groupId=${groupId}&editId=${selectedTransaction.id}`}
                  onClick={() => setSelectedTransaction(null)}
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
                  onClick={handleDeleteTransaction}
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
    </div>
  );
}
