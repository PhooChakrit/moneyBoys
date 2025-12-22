// Sample data for the app
import { Group, Expense, Settlement } from "./types";

export const groups: Group[] = [
  {
    id: 1,
    name: "Trip to Chiang Mai",
    members: 4,
    balance: 250,
    avatars: ["P", "B", "N", "S"],
  },
  {
    id: 2,
    name: "Roommates",
    members: 3,
    balance: -180,
    avatars: ["A", "M", "K"],
  },
  {
    id: 3,
    name: "Office Lunch",
    members: 6,
    balance: 0,
    avatars: ["T", "R", "J", "W"],
  },
];

export const expenses: Expense[] = [
  {
    id: 1,
    title: "Dinner at Riverside",
    amount: 800,
    paidBy: "Pim",
    avatar: "P",
    date: "Today",
  },
  {
    id: 2,
    title: "Grab to Temple",
    amount: 200,
    paidBy: "Bank",
    avatar: "B",
    date: "Yesterday",
  },
  {
    id: 3,
    title: "Hotel Room",
    amount: 2500,
    paidBy: "Pim",
    avatar: "P",
    date: "Dec 20",
  },
  {
    id: 4,
    title: "Breakfast",
    amount: 450,
    paidBy: "Nook",
    avatar: "N",
    date: "Dec 20",
  },
];

export const settlements: Settlement[] = [
  { id: 1, from: "Pim", to: "Bank", amount: 250, status: "pending" },
  { id: 2, from: "Nook", to: "Pim", amount: 180, status: "paid" },
  { id: 3, from: "Som", to: "Bank", amount: 250, status: "pending" },
];
