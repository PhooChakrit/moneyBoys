import { Input } from "@/components/ui/input";
import { ValidatedNumberInput } from "@/components/ui/validated-number-input";
import { useTranslations } from "next-intl";

interface ExpenseBasicInfoProps {
  title: string;
  setTitle: (value: string) => void;
  amount: number | null;
  setAmount: (value: number | null) => void;
}

export function ExpenseBasicInfo({
  title,
  setTitle,
  amount,
  setAmount,
}: ExpenseBasicInfoProps) {
  const t = useTranslations("addExpense");

  return (
    <>
      {/* Description */}
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

      {/* Amount */}
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
    </>
  );
}
