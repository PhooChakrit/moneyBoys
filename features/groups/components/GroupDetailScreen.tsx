"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useGroupDetail } from "./useGroupDetail";
import { BubbleVisualization } from "./BubbleVisualization";
import { InviteDialog } from "./InviteDialog";
import { SettingsDialog } from "./SettingsDialog";
import { DebtsSection } from "./DebtsSection";
import { TransactionsSection } from "./TransactionsSection";
import { LeaveGroupDialog } from "./LeaveGroupDialog";
import { MemberPaymentModal } from "./MemberPaymentModal";
import { TransactionDetailModal } from "./TransactionDetailModal";

interface GroupDetailScreenProps {
  groupId: string;
}

export function GroupDetailScreen({ groupId }: GroupDetailScreenProps) {
  const {
    // Navigation
    locale,
    t,

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
    getBubbleSize,
    getBubblePosition,
  } = useGroupDetail({ groupId });

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
            <InviteDialog
              open={inviteDialogOpen}
              onOpenChange={setInviteDialogOpen}
              inviteCode={group.inviteCode}
              locale={locale}
              copied={copied}
              onCopyCode={copyInviteCode}
              onCopyLink={copyInviteLink}
            />

            <SettingsDialog
              open={settingsDialogOpen}
              onOpenChange={setSettingsDialogOpen}
              group={group}
              members={members}
              isEditing={isEditing}
              editName={editName}
              editDescription={editDescription}
              savingGroup={savingGroup}
              removingMember={removingMember}
              onSetIsEditing={setIsEditing}
              onSetEditName={setEditName}
              onSetEditDescription={setEditDescription}
              onStartEditing={startEditing}
              onSaveGroupChanges={saveGroupChanges}
              onRemoveMember={removeMember}
              onLeaveGroup={() => {
                setSettingsDialogOpen(false);
                setShowLeaveConfirm(true);
              }}
              t={t}
            />
          </div>
        </div>

        {/* Bubble Visualization */}
        <BubbleVisualization
          members={members}
          maxBalance={maxBalance}
          onMemberClick={setSelectedMember}
          getBubbleSize={getBubbleSize}
          getBubblePosition={getBubblePosition}
        />

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
              ),
            )}
          </div>
        )}

        {/* Group name */}
        <div className="text-white">
          <span className="text-lg font-medium">{group.name}</span>
        </div>
      </div>

      {/* Debts Section */}
      <DebtsSection
        debts={debts}
        members={members}
        groupId={groupId}
        locale={locale}
        onMemberClick={setSelectedMember}
        t={t}
      />

      <Separator className="dark:bg-gray-700" />

      {/* Transactions Section */}
      <TransactionsSection
        transactions={transactions}
        showAllTransactions={showAllTransactions}
        initialLimit={INITIAL_TRANSACTIONS_LIMIT}
        onToggleShowAll={() => setShowAllTransactions(!showAllTransactions)}
        onTransactionClick={setSelectedTransaction}
        t={t}
      />

      {/* Leave Group Confirmation Dialog */}
      <LeaveGroupDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        groupName={group.name}
        leaving={leaving}
        onLeave={handleLeaveGroup}
        t={t}
      />

      {/* Member Payment Modal */}
      <MemberPaymentModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        t={t}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        groupId={groupId}
        locale={locale}
        deletingTransaction={deletingTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDelete={handleDeleteTransaction}
        t={t}
      />
    </div>
  );
}
