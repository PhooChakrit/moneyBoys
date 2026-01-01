import { BottomNav } from "@/components/layout/BottomNav";
import { getTranslations } from "next-intl/server";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      {/* Desktop sidebar nav - hidden on mobile/tablet */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-[280px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 z-10">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          FriendPay
        </h1>
        <nav className="space-y-2">
          <SidebarNav locale={locale} />
        </nav>
      </aside>

      {/* Main content area */}
      <main className="min-h-screen bg-white dark:bg-gray-900 lg:bg-gray-50 lg:dark:bg-gray-900 lg:ml-[280px]">
        {children}
      </main>

      {/* Bottom nav - hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </>
  );
}

// Sidebar navigation for desktop
async function SidebarNav({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "nav" });

  const navItems = [
    { href: `/${locale}`, icon: "🏠", label: t("home") },
    { href: `/${locale}/groups`, icon: "👥", label: t("groups") },
    { href: `/${locale}/settle`, icon: "✓", label: t("settle") },
    { href: `/${locale}/settings`, icon: "⚙️", label: t("settings") },
  ];

  return (
    <>
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-xl">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </a>
      ))}
      <a
        href={`/${locale}/add-expense`}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-3 text-white hover:bg-emerald-600 transition-colors"
      >
        <span className="text-xl">+</span>
        <span className="font-medium">{t("addExpense")}</span>
      </a>
    </>
  );
}
