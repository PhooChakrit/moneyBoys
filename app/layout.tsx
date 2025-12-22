import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoneyBoy - Expense Splitting",
  description: "Split expenses with friends easily",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
