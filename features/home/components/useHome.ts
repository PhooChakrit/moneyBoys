import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import api from "@/lib/api";

export interface DashboardGroup {
  id: string;
  name: string;
  members: number;
  balance: number;
  avatars: string[];
  role: string;
}

export interface DashboardData {
  groups: DashboardGroup[];
  summary: {
    totalBalance: number;
    youAreOwed: number;
    youOwe: number;
    netBalance: number;
  };
}

export function useHome() {
  const params = useParams();
  const locale = params.locale as string;
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Wait for auth to complete before fetching
    if (authLoading) return;

    // Don't fetch if not authenticated - api interceptor handles redirect on 401
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent double fetch in React strict mode
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchDashboard() {
      try {
        const res = await api.get("/dashboard");
        setDashboardData(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [authLoading, user]);

  const formatCurrency = (amount: number) => {
    const sign = amount > 0 ? "+" : "";
    return `${sign}${amount.toLocaleString()}฿`;
  };

  return {
    user,
    authLoading,
    dashboardData,
    loading,
    locale,
    formatCurrency,
  };
}
