"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/features/auth/context/AuthContext";

interface SettingsItem {
  icon: string;
  label: string;
  value: string;
  href?: string;
}

export function useSettings() {
  const t = useTranslations("settings");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params.locale as string;
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  // Switch locale
  const switchLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  // Settings menu items
  const settingsItems: SettingsItem[] = [
    {
      icon: "👤",
      label: t("account"),
      value: "",
      href: `/${locale}/profile`,
    },
    {
      icon: "💳",
      label: t("paymentMethod"),
      value: "",
      href: `/${locale}/payment-method`,
    },
  ];

  // Navigate to settings item
  const navigateToItem = (href?: string) => {
    if (href) {
      router.push(href);
    }
  };

  return {
    // Navigation
    t,
    locale,

    // User
    user,

    // Theme
    theme,
    setTheme,
    mounted,

    // Actions
    handleLogout,
    switchLocale,
    navigateToItem,

    // Data
    settingsItems,
  };
}
