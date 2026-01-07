import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { useTranslations } from "next-intl";

interface ExpenseHeaderProps {
  isEditMode: boolean;
  selectedGroupId: string | null;
  locale: string;
}

export function ExpenseHeader({
  isEditMode,
  selectedGroupId,
  locale,
}: ExpenseHeaderProps) {
  const t = useTranslations("addExpense");

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-5 lg:px-8 pt-8 lg:pt-12 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href={
            selectedGroupId
              ? `/${locale}/groups/${selectedGroupId}`
              : `/${locale}/groups`
          }
          className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold text-white">
          {isEditMode ? t("editTitle") : t("title")}
        </h1>
      </div>
    </div>
  );
}
