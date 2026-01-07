import { AvatarDisplay } from "@/components/ui/avatar-display";
import { GroupMember } from "./useAddExpense";
import { useTranslations } from "next-intl";

interface PayerSelectorProps {
  members: GroupMember[];
  paidById: string;
  setPaidById: (id: string) => void;
}

export function PayerSelector({
  members,
  paidById,
  setPaidById,
}: PayerSelectorProps) {
  const t = useTranslations("addExpense");

  return (
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
  );
}
