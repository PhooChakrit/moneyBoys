"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

export interface MemberData {
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

export interface TransactionData {
  id: string;
  title: string;
  amount: number;
  currency: string;
  paidBy: string;
  paidById: string;
  date: string;
  participants: string[];
}

export interface DebtData {
  from: string;
  fromId: string;
  fromBalance: number;
  to: string;
  toId: string;
}

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  allowMemberEdit: boolean;
  inviteCode: string;
  memberCount: number;
  expenseCount: number;
  role: string;
}

export interface UseGroupDetailProps {
  groupId: string;
}

export function useGroupDetail({ groupId }: UseGroupDetailProps) {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

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
        const { data } = await api.get(`/groups/${groupId}`);
        setGroup(data.group);
        setMembers(data.members || []);
        setTransactions(data.transactions || []);
        setDebts(data.debts || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load group";
        setError(message);
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
      const { data } = await api.patch(`/groups/${groupId}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setGroup({
        ...group,
        name: data.group.name,
        description: data.group.description,
      });
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update group";
      alert(message);
    } finally {
      setSavingGroup(false);
    }
  };

  // Remove a member (admin only)
  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setRemovingMember(memberId);
    try {
      await api.delete(`/groups/${groupId}/members?memberId=${memberId}`);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      alert(message);
    } finally {
      setRemovingMember(null);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    if (
      !confirm(
        "Are you sure you want to delete this expense? This cannot be undone.",
      )
    )
      return;

    setDeletingTransaction(true);
    try {
      await api.delete(`/expenses/${selectedTransaction.id}`);
      // Remove from local state
      setTransactions(
        transactions.filter((t) => t.id !== selectedTransaction.id),
      );
      setSelectedTransaction(null);
      // Refetch to update balances
      const { data } = await api.get(`/groups/${groupId}`);
      setMembers(data.members || []);
      setDebts(data.debts || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete expense";
      alert(message);
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

  // Leave group
  const handleLeaveGroup = async () => {
    setLeaving(true);
    try {
      await api.delete(`/groups/${groupId}/members?memberId=self`);
      router.push(`/${locale}/groups`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to leave group";
      alert(message);
    } finally {
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  // Delete group (admin only)
  const handleDeleteGroup = async () => {
    setDeletingGroup(true);
    try {
      await api.delete(`/groups/${groupId}`);
      router.push(`/${locale}/groups`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete group";
      alert(message);
    } finally {
      setDeletingGroup(false);
      setShowDeleteConfirm(false);
    }
  };

  // Toggle allow member edit
  const toggleAllowMemberEdit = async (allow: boolean) => {
    if (!group) return;
    try {
      await api.patch(`/groups/${groupId}`, { allowMemberEdit: allow });
      setGroup({ ...group, allowMemberEdit: allow });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update setting";
      alert(message);
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      await api.patch(`/groups/${groupId}/members`, { memberId, role });
      setMembers(members.map((m) => (m.id === memberId ? { ...m, role } : m)));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update role";
      alert(message);
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

  const maxBalance = Math.max(...members.map((m) => Math.abs(m.balance)), 1);

  return {
    // Navigation
    locale,
    router,
    t,
    groupId,

    // Data states
    loading,
    error,
    group,
    members,
    transactions,
    debts,
    maxBalance,

    // Dialog states
    inviteDialogOpen,
    setInviteDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,
    copied,
    leaving,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deletingGroup,

    // Admin editing states
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    savingGroup,
    removingMember,

    // Transaction display
    showAllTransactions,
    setShowAllTransactions,
    INITIAL_TRANSACTIONS_LIMIT,

    // Member modal
    selectedMember,
    setSelectedMember,

    // Transaction modal
    selectedTransaction,
    setSelectedTransaction,
    deletingTransaction,

    // Actions
    copyInviteLink,
    copyInviteCode,
    startEditing,
    saveGroupChanges,
    removeMember,
    handleDeleteTransaction,
    handleLeaveGroup,
    handleDeleteGroup,
    toggleAllowMemberEdit,
    updateMemberRole,
    getBubbleSize,
    getBubblePosition,
  };
}
