"use client";

import { useHome } from "./components/useHome";
import { HomeHeader } from "./components/HomeHeader";
import { BalanceCard } from "./components/BalanceCard";
import { QuickActions } from "./components/QuickActions";
import { RecentGroups } from "./components/RecentGroups";

export function HomeScreen() {
  const { user, authLoading, dashboardData, loading, locale, formatCurrency } =
    useHome();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Header */}
      <HomeHeader user={user} loading={authLoading} />

      {/* Balance Card */}
      <BalanceCard
        summary={dashboardData?.summary}
        loading={loading}
        formatCurrency={formatCurrency}
      />

      {/* Quick Actions */}
      <QuickActions locale={locale} />

      {/* Recent Groups */}
      <RecentGroups
        groups={dashboardData?.groups}
        loading={loading}
        locale={locale}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
