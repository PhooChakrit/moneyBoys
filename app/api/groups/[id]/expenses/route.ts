import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface DebtMap {
  [fromUserId: string]: {
    [toUserId: string]: number;
  };
}

interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

// Simplify debts to minimize transactions
function simplifyDebts(
  expenses: Array<{
    amount: number;
    paidById: string;
    splits: Array<{ userId: string; amount: number }>;
  }>,
  members: Array<{ userId: string; user: { id: string; name: string } }>,
): SimplifiedDebt[] {
  // Calculate net balance for each user
  const netBalance: { [userId: string]: number } = {};

  // Initialize all members with 0 balance
  members.forEach((m) => {
    netBalance[m.userId] = 0;
  });

  // Process each expense
  expenses.forEach((expense) => {
    // The payer gets credit for what they paid
    netBalance[expense.paidById] =
      (netBalance[expense.paidById] || 0) + expense.amount;

    // Each person in the split owes their share
    expense.splits.forEach((split) => {
      netBalance[split.userId] = (netBalance[split.userId] || 0) - split.amount;
    });
  });

  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  Object.entries(netBalance).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id: userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: userId, amount: -balance });
    }
  });

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Build user name map
  const userNameMap: { [id: string]: string } = {};
  members.forEach((m) => {
    userNameMap[m.userId] = m.user.name;
  });

  // Greedy algorithm to simplify debts
  const simplifiedDebts: SimplifiedDebt[] = [];

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      simplifiedDebts.push({
        fromUserId: debtor.id,
        fromUserName: userNameMap[debtor.id] || "Unknown",
        toUserId: creditor.id,
        toUserName: userNameMap[creditor.id] || "Unknown",
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return simplifiedDebts;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: user.id, groupId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    // Get all expenses for the group
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        paidBy: {
          select: { id: true, name: true, avatar: true },
        },
        splits: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get all group members for debt calculation
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Get completed settlements
    const settlements = await prisma.settlement.findMany({
      where: { groupId, status: "completed" },
    });

    // Calculate simplified debts (including settlements)
    const simplifiedDebts = simplifyDebtsWithSettlements(
      expenses,
      members,
      settlements,
    );

    return NextResponse.json({
      expenses,
      simplifiedDebts,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Simplify debts including settlements
function simplifyDebtsWithSettlements(
  expenses: Array<{
    amount: number;
    paidById: string;
    splits: Array<{ userId: string; amount: number }>;
  }>,
  members: Array<{ userId: string; user: { id: string; name: string } }>,
  settlements: Array<{ fromUserId: string; toUserId: string; amount: number }>,
): SimplifiedDebt[] {
  const netBalance: { [userId: string]: number } = {};

  members.forEach((m) => {
    netBalance[m.userId] = 0;
  });

  // Process expenses
  expenses.forEach((expense) => {
    netBalance[expense.paidById] =
      (netBalance[expense.paidById] || 0) + expense.amount;
    expense.splits.forEach((split) => {
      netBalance[split.userId] = (netBalance[split.userId] || 0) - split.amount;
    });
  });

  // Process settlements
  settlements.forEach((settlement) => {
    netBalance[settlement.fromUserId] =
      (netBalance[settlement.fromUserId] || 0) + settlement.amount;
    netBalance[settlement.toUserId] =
      (netBalance[settlement.toUserId] || 0) - settlement.amount;
  });

  // Build user name map
  const userNameMap: { [id: string]: string } = {};
  members.forEach((m) => {
    userNameMap[m.userId] = m.user.name;
  });

  // Greedy algorithm
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  Object.entries(netBalance).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id: userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: userId, amount: -balance });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const simplifiedDebts: SimplifiedDebt[] = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      simplifiedDebts.push({
        fromUserId: debtor.id,
        fromUserName: userNameMap[debtor.id] || "Unknown",
        toUserId: creditor.id,
        toUserName: userNameMap[creditor.id] || "Unknown",
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return simplifiedDebts;
}
