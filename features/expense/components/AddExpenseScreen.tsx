"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounceCallback } from "usehooks-ts";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ValidatedNumberInput } from "@/components/ui/validated-number-input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon } from "@/components/icons";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { useAuth } from "@/features/auth/context/AuthContext";

interface GroupMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface GroupOption {
  id: string;
  name: string;
}

export function AddExpenseScreen() {
  const t = useTranslations("addExpense");
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
        const res = await fetch("/api/groups");
        if (res.ok) {
          const data = await res.json();
          setGroups(
            data.groups.map((g: { id: string; name: string }) => ({
              id: g.id,
              name: g.name,
            })),
          );
        }
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
        const res = await fetch(`/api/groups/${selectedGroupId}/members`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members);
          if (user?.id) {
            setPaidById(user.id);
            setSelectedMembers(data.members.map((m: GroupMember) => m.userId));
          }
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
        const res = await fetch(`/api/expenses/${editId}`);
        if (res.ok) {
          const data = await res.json();
          const expense = data.expense;
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
              (a: number, i: number) =>
                i > 0 && Math.abs(a - amounts[0]) > 0.01,
            );

            if (isCustom) {
              setSplitEqually(false);
              const amountsMap: { [userId: string]: number | null } = {};
              expense.splits.forEach(
                (s: { userId: string; amount: number }) => {
                  amountsMap[s.userId] = s.amount;
                },
              );
              setCustomAmounts(amountsMap);
            }
          }
        } else {
          setError("Failed to load expense");
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

      let res;
      if (isEditMode && editId) {
        // Update existing expense
        res = await fetch(`/api/expenses/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            amount: amount,
            paidById,
            splits,
          }),
        });
      } else {
        // Create new expense
        res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: selectedGroupId,
            title,
            amount: amount,
            paidById,
            splits,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(
          data.error || `Failed to ${isEditMode ? "update" : "add"} expense`,
        );
        return;
      }

      // Success - go back to group detail
      router.push(`/${locale}/groups/${selectedGroupId}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Link
            href={
              selectedGroupId
                ? `/${locale}/groups/${selectedGroupId}`
                : `/${locale}/groups`
            }
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? t("editTitle") : t("title")}
          </h1>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Group Selector - Only show when not coming from a specific group */}
        {!urlGroupId && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t("group")}
            </label>
            {groups.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  {t("noGroupsMessage")}
                </p>
                <Link href={`/${locale}/groups`}>
                  <Button size="sm">{t("goToGroups")}</Button>
                </Link>
              </div>
            ) : (
              <Select
                value={selectedGroupId || ""}
                onValueChange={handleGroupSelect}
              >
                <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 text-gray-900 dark:text-white">
                  <SelectValue placeholder={t("selectGroup")} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800">
                  {groups.map((group) => (
                    <SelectItem
                      key={group.id}
                      value={group.id}
                      className="dark:text-white dark:focus:bg-gray-700"
                    >
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Description - always visible */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("description")}
          </label>
          <Input
            placeholder={t("descriptionPlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-0 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>

        {/* Amount - always visible */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("amount")}
          </label>
          <div className="relative">
            <ValidatedNumberInput
              placeholder="0"
              value={amount}
              onChange={setAmount}
              positiveOnly
              className="h-14 w-full rounded-xl bg-gray-50 dark:bg-gray-800 border-0 text-2xl font-bold pr-12 dark:text-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              ฿
            </span>
          </div>
        </div>

        {/* Who paid - show members when loaded */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("paidBy")}
          </label>
          {members.length > 0 ? (
            <div className="flex gap-3 flex-wrap">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidById(member.userId)}
                  className={`rounded-full transition-all ${
                    paidById === member.userId
                      ? "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900"
                      : ""
                  }`}
                >
                  <AvatarDisplay
                    avatarKey={member.user.avatar}
                    name={member.user.name}
                    size="md"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm py-2">
              {t("selectGroupFirst")}
            </p>
          )}
        </div>

        {/* Split with - show members when loaded */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t("splitWith")}
          </label>
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              variant={splitEqually ? "default" : "outline"}
              onClick={() => setSplitEqually(true)}
              className={`rounded-full ${
                splitEqually ? "bg-emerald-500 hover:bg-emerald-600" : ""
              }`}
            >
              {t("splitEqually")}
            </Button>
            <Button
              type="button"
              variant={!splitEqually ? "default" : "outline"}
              onClick={handleSwitchToCustom}
              className={`rounded-full ${
                !splitEqually ? "bg-emerald-500 hover:bg-emerald-600" : ""
              } dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}
            >
              {t("custom")}
            </Button>
          </div>
          {members.length > 0 ? (
            <>
              {splitEqually ? (
                /* Equal split - show member badges to select/deselect */
                <>
                  <div className="flex gap-2 flex-wrap">
                    {members.map((member) => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        onClick={() => toggleMember(member.userId)}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                          selectedMembers.includes(member.userId)
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {member.user.name}{" "}
                        {selectedMembers.includes(member.userId) ? "✓" : ""}
                      </Badge>
                    ))}
                  </div>
                  {amount !== null && selectedMembers.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Each person pays:{" "}
                      <span className="font-semibold">
                        ฿{(amount / selectedMembers.length).toFixed(2)}
                      </span>
                    </p>
                  )}
                </>
              ) : (
                /* Custom split - show input for each member's amount */
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <AvatarDisplay
                        avatarKey={member.user.avatar}
                        name={member.user.name}
                        size="sm"
                      />
                      <span className="flex-1 text-gray-700 dark:text-gray-300 text-sm">
                        {member.user.name}
                      </span>
                      <div className="relative w-28">
                        <ValidatedNumberInput
                          min={0}
                          placeholder="0"
                          value={customAmounts[member.userId] ?? null}
                          onChange={(val) =>
                            handleCustomAmountChange(member.userId, val)
                          }
                          positiveOnly
                          className="h-10 w-full rounded-lg bg-gray-50 dark:bg-gray-800 border-0 text-right pr-8 dark:text-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          ฿
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Total display */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Total:
                    </span>
                    <span
                      className={`font-semibold ${
                        amount !== null &&
                        Math.abs(
                          Object.values(customAmounts).reduce(
                            (sum, val) => (sum ?? 0) + (val ?? 0),
                            0 as number | null,
                          )! - amount,
                        ) < 0.01
                          ? "text-emerald-500"
                          : "text-orange-500"
                      }`}
                    >
                      ฿
                      {(
                        Object.values(customAmounts).reduce(
                          (sum, val) => (sum ?? 0) + (val ?? 0),
                          0 as number | null,
                        ) ?? 0
                      ).toFixed(2)}
                      {amount !== null && (
                        <span className="text-gray-400 font-normal">
                          {" "}
                          / ฿{amount.toFixed(2)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {t("selectGroupFirst")}
            </p>
          )}
        </div>

        {/* Warning for over-allocation */}
        {isCustomOverAmount && (
          <p className="text-red-500 dark:text-red-400 text-sm font-medium">
            ⚠️ Total split (฿{customTotal.toFixed(2)}) exceeds expense amount (฿
            {amount?.toFixed(2)})
          </p>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            loadingExpense ||
            !selectedGroupId ||
            !title ||
            !amount ||
            !selectedMembers.length ||
            isCustomOverAmount
          }
          className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold mt-4 disabled:opacity-50"
        >
          {submitting
            ? isEditMode
              ? t("updating")
              : "Adding..."
            : isEditMode
              ? t("editSubmit")
              : t("submit")}
        </Button>
      </div>
    </div>
  );
}
