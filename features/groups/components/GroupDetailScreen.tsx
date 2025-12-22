"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeftIcon,
  PlusIcon,
  ArrowRightIcon,
  MoreIcon,
} from "@/components/icons";
import { groups } from "@/lib/data";
import { MemberBalance, Transaction, Debt } from "@/lib/types";

interface GroupDetailScreenProps {
  groupId: string;
}

export function GroupDetailScreen({ groupId }: GroupDetailScreenProps) {
  const params = useParams();
  const locale = params.locale as string;

  // Find the group by ID
  const group = groups.find((g) => g.id === parseInt(groupId)) || groups[0];

  // Member balance data for bubbles
  const memberBalances: MemberBalance[] = [
    { name: "Amonrujee", balance: -1218, initials: "A", size: "lg" },
    { name: "Thanapat", balance: -738.25, initials: "T", size: "md" },
    { name: "บอกก็รู้ดี", balance: -946, initials: "บ", size: "md" },
    { name: "fah", balance: 0, initials: "F", size: "sm" },
    { name: "plengplern", balance: 0, initials: "P", size: "sm" },
    { name: "natthanean", balance: 2902, initials: "N", size: "sm" },
  ];

  const transactions: Transaction[] = [
    {
      id: 1,
      title: "ข้าวต้ม",
      amount: 485,
      paidBy: "บอกก็รู้ดี",
      date: "22 Dec 2567 at 21:45",
      participants: ["A", "T", "N", "P"],
    },
    {
      id: 2,
      title: "คืน",
      amount: 469,
      paidBy: "Thanapat",
      date: "22 Dec 2567 at 18:52",
      participants: ["N"],
    },
    {
      id: 3,
      title: "น้ำมัน",
      amount: 500,
      paidBy: "natthanean",
      date: "22 Dec 2567 at 18:51",
      participants: ["A", "T", "N", "P"],
    },
  ];

  const debts: Debt[] = [
    { from: "Amonrujee", fromBalance: 1218, to: "natthanean" },
  ];

  // Bubble size classes
  const getBubbleSize = (size: string) => {
    switch (size) {
      case "lg":
        return "w-28 h-28";
      case "md":
        return "w-20 h-20";
      case "sm":
        return "w-14 h-14";
      default:
        return "w-16 h-16";
    }
  };

  // Bubble position classes for layout
  const bubblePositions = [
    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
    "top-[20%] left-[15%] -translate-x-1/2 -translate-y-1/2",
    "bottom-[25%] left-[20%] -translate-x-1/2 -translate-y-1/2",
    "top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-[25%] right-[10%] -translate-x-1/2 -translate-y-1/2",
    "bottom-[20%] right-[15%] -translate-x-1/2 -translate-y-1/2",
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-5 lg:px-8 pt-8 lg:pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/${locale}/groups`}
            className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
          </Link>
          <button className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center">
            <MoreIcon className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* Bubble Visualization */}
        <div className="relative h-72 mb-4">
          {memberBalances.map((member, i) => (
            <div
              key={i}
              className={`absolute ${bubblePositions[i]} transition-all duration-300`}
            >
              <div
                className={`${getBubbleSize(
                  member.size,
                )} rounded-full flex flex-col items-center justify-center ${
                  member.balance < 0
                    ? "bg-amber-700/80"
                    : member.balance > 0
                      ? "bg-emerald-700/60"
                      : "bg-gray-600/60"
                }`}
              >
                <span className="text-white/90 text-xs font-medium truncate max-w-[80%]">
                  {member.name}
                </span>
                <span className="text-sm font-bold text-white">
                  {member.balance < 0 ? "" : member.balance > 0 ? "+" : ""}
                  {member.balance === 0
                    ? "THB 0"
                    : `THB ${Math.abs(member.balance).toLocaleString()}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === 0 ? "bg-white" : "bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Group name */}
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg font-medium">{group.name}</span>
          <button className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
            <PlusIcon className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white px-5 lg:px-8 py-4 lg:py-6">
        <h3 className="text-gray-800 font-semibold mb-4">Transactions</h3>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-start justify-between py-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 mt-1">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                    {tx.paidBy[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{tx.title}</p>
                  <p className="text-gray-500 text-sm">{tx.date}</p>
                  <p className="text-gray-500 text-sm">{tx.paidBy} paid for</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-600">THB {tx.amount}</p>
                <div className="flex -space-x-1 mt-1 justify-end">
                  {tx.participants.slice(0, 4).map((p, i) => (
                    <Avatar key={i} className="w-6 h-6 border border-white">
                      <AvatarFallback className="text-xs bg-gray-200">
                        {p}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full text-center text-emerald-600 font-medium py-3 mt-2">
          Show all
        </button>
      </div>

      <Separator />

      {/* Debts Section */}
      <div className="bg-white px-5 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-800 font-semibold">Debts</h3>
          <Link
            href={`/${locale}/add-expense`}
            className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </Link>
        </div>

        {debts.map((debt, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  {debt.from[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800">{debt.from}</p>
                <p className="text-emerald-600 font-bold">
                  THB {debt.fromBalance.toLocaleString()}
                </p>
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-gray-400 mx-4" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{debt.to}</p>
              </div>
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-amber-100 text-amber-700">
                  {debt.to[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
