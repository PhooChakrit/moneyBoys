import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { DashboardData } from "./useHome";

interface BalanceCardProps {
  summary: DashboardData["summary"] | undefined;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

export function BalanceCard({
  summary,
  loading,
  formatCurrency,
}: BalanceCardProps) {
  const t = useTranslations("home");

  return (
    <div className="px-5 lg:px-8">
      <Card className="mt-0 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg">
        <CardContent className="p-5">
          <p className="text-emerald-100 text-sm">{t("balanceTitle")}</p>
          {loading ? (
            <div className="h-10 bg-emerald-400/30 rounded animate-pulse mt-1 w-32" />
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mt-1">
                {formatCurrency(summary?.totalBalance || 0)}
              </h2>
              <p className="text-emerald-200 text-sm mt-2">
                {summary?.youOwe
                  ? `${t("youOweToPay")} ${summary.youOwe.toLocaleString()}฿`
                  : t("allSettled")}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
