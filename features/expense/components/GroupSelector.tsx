import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupOption } from "./useAddExpense";
import { useTranslations } from "next-intl";

interface GroupSelectorProps {
  groups: GroupOption[];
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
  urlGroupId: string | null;
  locale: string;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onSelect,
  urlGroupId,
  locale,
}: GroupSelectorProps) {
  const t = useTranslations("addExpense");

  // Don't show if groupId is in URL
  if (urlGroupId) return null;

  return (
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
        <Select value={selectedGroupId || ""} onValueChange={onSelect}>
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
  );
}
