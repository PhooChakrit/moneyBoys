import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarDisplay } from "@/components/ui/avatar-display";
import { ValidatedNumberInput } from "@/components/ui/validated-number-input";
import { GroupMember } from "./useAddExpense";
import { useTranslations } from "next-intl";

interface ExpenseSplitProps {
  members: GroupMember[];
  selectedMembers: string[];
  splitEqually: boolean;
  setSplitEqually: (value: boolean) => void;
  customAmounts: { [userId: string]: number | null };
  handleCustomAmountChange: (userId: string, value: number | null) => void;
  onToggleMember: (userId: string) => void;
  handleSwitchToCustom: () => void;
  amount: number | null;
}

export function ExpenseSplit({
  members,
  selectedMembers,
  splitEqually,
  setSplitEqually,
  customAmounts,
  handleCustomAmountChange,
  onToggleMember,
  handleSwitchToCustom,
  amount,
}: ExpenseSplitProps) {
  const t = useTranslations("addExpense");

  return (
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
                    onClick={() => onToggleMember(member.userId)}
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
  );
}
