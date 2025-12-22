// Type definitions for the app

export type Screen =
  | "home"
  | "groups"
  | "group-detail"
  | "dashboard"
  | "add-expense"
  | "settle"
  | "settings";

export interface Group {
  id: number;
  name: string;
  members: number;
  balance: number;
  avatars: string[];
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  paidBy: string;
  avatar: string;
  date: string;
}

export interface Settlement {
  id: number;
  from: string;
  to: string;
  amount: number;
  status: "pending" | "paid";
}

export interface MemberBalance {
  name: string;
  balance: number;
  initials: string;
  size: "lg" | "md" | "sm";
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  paidBy: string;
  date: string;
  participants: string[];
}

export interface Debt {
  from: string;
  fromBalance: number;
  to: string;
}
