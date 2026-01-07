"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAddExpense } from "./useAddExpense";
import { ExpenseHeader } from "./ExpenseHeader";
import { GroupSelector } from "./GroupSelector";
import { ExpenseBasicInfo } from "./ExpenseBasicInfo";
import { PayerSelector } from "./PayerSelector";
import { ExpenseSplit } from "./ExpenseSplit";

export function AddExpenseScreen() {
  const t = useTranslations("addExpense");

  const {
    // State
    locale,
    urlGroupId,
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
  } = useAddExpense();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24">
      {/* Header */}
      <ExpenseHeader
        isEditMode={isEditMode}
        selectedGroupId={selectedGroupId}
        locale={locale}
      />

      <div className="p-5 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Group Selector - Only show when not coming from a specific group */}
        <GroupSelector
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelect={handleGroupSelect}
          urlGroupId={urlGroupId}
          locale={locale}
        />

        {/* Description & Amount */}
        <ExpenseBasicInfo
          title={title}
          setTitle={setTitle}
          amount={amount}
          setAmount={setAmount}
        />

        {/* Who paid */}
        <PayerSelector
          members={members}
          paidById={paidById}
          setPaidById={setPaidById}
        />

        {/* Split with */}
        <ExpenseSplit
          members={members}
          selectedMembers={selectedMembers}
          splitEqually={splitEqually}
          setSplitEqually={setSplitEqually}
          customAmounts={customAmounts}
          handleCustomAmountChange={handleCustomAmountChange}
          onToggleMember={toggleMember}
          handleSwitchToCustom={handleSwitchToCustom}
          amount={amount}
        />

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
