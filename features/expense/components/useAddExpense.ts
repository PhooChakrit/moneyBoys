import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import api from "@/lib/api";
import { isAxiosError } from "axios";

export interface GroupMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface GroupOption {
  id: string;
  name: string;
}

export function useAddExpense() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const urlGroupId = searchParams.get("groupId");
  const editId = searchParams.get("editId"); // Edit mode
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [paidById, setPaidById] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [customAmounts, setCustomAmounts] = useState<{
    [userId: string]: number | null;
  }>({});
  const [lockedMembers, setLockedMembers] = useState<Set<string>>(new Set()); // Track manually edited members
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);

  // Group selection state
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    urlGroupId,
  );

  // Fetch user's groups only
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups");
        setGroups(
          res.data.groups.map((g: { id: string; name: string }) => ({
            id: g.id,
            name: g.name,
          })),
        );
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };

    fetchGroups();
  }, []);

  // Fetch members when group changes (from URL or selection)
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchMembers = async () => {
      try {
        const res = await api.get(`/groups/${selectedGroupId}/members`);
        setMembers(res.data.members);
        if (user?.id) {
          setPaidById(user.id);
          setSelectedMembers(
            res.data.members.map((m: GroupMember) => m.userId),
          );
        }
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };

    fetchMembers();
  }, [selectedGroupId, user?.id]);

  // Fetch expense data when editing
  useEffect(() => {
    if (!editId) return;

    const fetchExpense = async () => {
      setLoadingExpense(true);
      try {
        const res = await api.get(`/expenses/${editId}`);
        const expense = res.data.expense;
        setTitle(expense.title);
        setAmount(expense.amount);
        setPaidById(expense.paidById);
        setSelectedGroupId(expense.groupId);
        setIsEditMode(true);

        // Set up splits
        if (expense.splits && expense.splits.length > 0) {
          const splitUserIds = expense.splits.map(
            (s: { userId: string }) => s.userId,
          );
          setSelectedMembers(splitUserIds);

          // Check if custom split (not all equal)
          const amounts = expense.splits.map(
            (s: { amount: number }) => s.amount,
          );
          const isCustom = amounts.some(
            (a: number, i: number) => i > 0 && Math.abs(a - amounts[0]) > 0.01,
          );

          if (isCustom) {
            setSplitEqually(false);
            const amountsMap: { [userId: string]: number | null } = {};
            expense.splits.forEach((s: { userId: string; amount: number }) => {
              amountsMap[s.userId] = s.amount;
            });
            setCustomAmounts(amountsMap);
          }
        }
      } catch {
        setError("Failed to load expense");
      } finally {
        setLoadingExpense(false);
      }
    };

    fetchExpense();
  }, [editId]);

  // Handle group selection - just update state, useEffect fetches members
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    // Clear previous members while new ones load (optional, for smooth transition)
    setMembers([]);
    setSelectedMembers([]);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Auto-split remaining amount among unlocked members
  const autoSplitAmounts = (
    lockedUserAmounts: { [userId: string]: number | null },
    lockedUserIds: Set<string>,
    totalAmount: number,
    allUserIds: string[],
  ) => {
    // Calculate total locked amount
    const lockedTotal = Array.from(lockedUserIds).reduce(
      (sum, userId) => sum + (lockedUserAmounts[userId] ?? 0),
      0,
    );

    // Calculate remaining amount to split
    const remaining = Math.max(0, totalAmount - lockedTotal);
    const unlockedUsers = allUserIds.filter((id) => !lockedUserIds.has(id));
    const perPerson =
      unlockedUsers.length > 0 ? remaining / unlockedUsers.length : 0;

    // Build new amounts
    const newAmounts: { [userId: string]: number | null } = {};
    allUserIds.forEach((userId) => {
      if (lockedUserIds.has(userId)) {
        newAmounts[userId] = lockedUserAmounts[userId];
      } else {
        // Round to 2 decimal places
        newAmounts[userId] = Math.round(perPerson * 100) / 100;
      }
    });

    return newAmounts;
  };

  // Switch to custom mode with auto-filled equal amounts
  const handleSwitchToCustom = () => {
    setSplitEqually(false);
    setLockedMembers(new Set()); // Reset locked members

    if (amount !== null && selectedMembers.length > 0) {
      const perPerson =
        Math.round((amount / selectedMembers.length) * 100) / 100;
      const newAmounts: { [userId: string]: number | null } = {};
      selectedMembers.forEach((userId) => {
        newAmounts[userId] = perPerson;
      });
      setCustomAmounts(newAmounts);
    }
  };

  // Use ref to track locked members for debounce callback (always current)
  const lockedMembersRef = useRef<Set<string>>(lockedMembers);
  useEffect(() => {
    lockedMembersRef.current = lockedMembers;
  }, [lockedMembers]);

  // Track currently editing user to avoid overwriting during typing
  const editingUserRef = useRef<string | null>(null);

  // Debounced auto-redistribution (1000ms delay)
  const debouncedRedistribute = useDebounceCallback(() => {
    if (amount !== null && selectedMembers.length > 0) {
      const currentLocked = lockedMembersRef.current;

      setCustomAmounts((currentAmounts) => {
        // First, clamp locked amounts so they don't exceed total
        const clampedAmounts = { ...currentAmounts };
        let totalLocked = 0;

        // Clamp each locked user's amount to ensure total doesn't exceed amount
        Array.from(currentLocked).forEach((userId) => {
          const userValue = clampedAmounts[userId] ?? 0;
          const maxForUser = Math.max(0, amount - totalLocked);
          clampedAmounts[userId] = Math.min(userValue, maxForUser);
          totalLocked += clampedAmounts[userId] ?? 0;
        });

        // Then redistribute remaining to unlocked members
        const redistributed = autoSplitAmounts(
          clampedAmounts,
          currentLocked,
          amount,
          selectedMembers,
        );
        return redistributed;
      });
    }
    // Clear editing user after redistribution
    editingUserRef.current = null;
  }, 1000);

  // Handle custom amount change - show value immediately, redistribute after debounce
  const handleCustomAmountChange = useCallback(
    (userId: string, value: number | null) => {
      // Mark this user as currently editing
      editingUserRef.current = userId;

      // Treat null (empty input) as 0 to keep user locked
      const actualValue = value ?? 0;

      // Lock this member if they have been manually edited
      const newLocked = new Set(lockedMembers);
      newLocked.add(userId); // Always lock when user edits
      setLockedMembers(newLocked);
      lockedMembersRef.current = newLocked;

      // Update ONLY this user's amount immediately (responsive UI)
      setCustomAmounts((prev) => ({
        ...prev,
        [userId]: actualValue,
      }));

      // Debounced redistribution for unlocked members
      debouncedRedistribute();

      // Auto-add to selected members if amount > 0
      if (value !== null && value > 0 && !selectedMembers.includes(userId)) {
        setSelectedMembers((prev) => [...prev, userId]);
      }
    },
    [lockedMembers, selectedMembers, debouncedRedistribute],
  );

  // Calculate custom total for validation
  const customTotal =
    Object.values(customAmounts).reduce(
      (sum, val) => (sum ?? 0) + (val ?? 0),
      0 as number | null,
    ) ?? 0;

  // Check if custom split exceeds amount
  const isCustomOverAmount =
    !splitEqually && amount !== null && customTotal > amount;

  const handleSubmit = async () => {
    if (
      !title ||
      !amount ||
      !paidById ||
      !selectedMembers.length ||
      !selectedGroupId
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Build splits based on split type
      let splits;
      if (splitEqually) {
        // Equal split - each person gets share of 1
        splits = selectedMembers.map((userId) => ({
          userId,
          share: 1,
        }));
      } else {
        // Custom split - calculate shares based on custom amounts
        const totalCustom = selectedMembers.reduce(
          (sum, userId) => sum + (customAmounts[userId] || 0),
          0,
        );

        if (totalCustom <= 0) {
          setError("Please enter amounts for each person");
          setSubmitting(false);
          return;
        }

        // Warn if total doesn't match but still allow (API will handle calculation)
        splits = selectedMembers.map((userId) => ({
          userId,
          share: customAmounts[userId] || 0,
        }));
      }

      const payload = {
        title,
        amount,
        paidById,
        splits,
        ...(isEditMode ? {} : { groupId: selectedGroupId }),
      };

      if (isEditMode && editId) {
        await api.patch(`/expenses/${editId}`, payload);
      } else {
        await api.post("/expenses", payload);
      }

      // Success - go back to group detail
      router.push(`/${locale}/groups/${selectedGroupId}`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(`Failed to ${isEditMode ? "update" : "add"} expense`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // State
    locale,
    urlGroupId,
    editId,
    title,
    setTitle,
    amount,
    setAmount,
    paidById,
    setPaidById,
    selectedMembers,
    splitEqually,
    setSplitEqually,
    customAmounts,
    members,
    submitting,
    error,
    isEditMode,
    loadingExpense,
    groups,
    selectedGroupId,
    customTotal,
    isCustomOverAmount,

    // Handlers
    handleGroupSelect,
    toggleMember,
    handleSwitchToCustom,
    handleCustomAmountChange,
    handleSubmit,
  };
}
