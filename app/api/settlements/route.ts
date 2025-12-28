import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface SimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatar: string | null;
  amount: number;
  groupId: string;
  groupName: string;
}

// Calculate simplified debts for a user across all their groups
async function calculateUserDebts(userId: string): Promise<{
  youOwe: SimplifiedDebt[];
  owedToYou: SimplifiedDebt[];
  totalYouOwe: number;
  totalOwedToYou: number;
}> {
  // Get all groups user is in
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          expenses: {
            include: {
              paidBy: { select: { id: true, name: true, avatar: true } },
              splits: true,
            },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          settlements: {
            where: { status: "completed" },
          },
        },
      },
    },
  });

  const youOwe: SimplifiedDebt[] = [];
  const owedToYou: SimplifiedDebt[] = [];

  for (const membership of memberships) {
    const group = membership.group;
    const expenses = group.expenses;
    const members = group.members;
    const settlements = group.settlements;

    // Calculate net balance for each user in this group
    const netBalance: { [uid: string]: number } = {};

    members.forEach((m) => {
      netBalance[m.userId] = 0;
    });

    // Add expenses: payer gets credit, splitters get debt
    expenses.forEach((expense) => {
      netBalance[expense.paidById] =
        (netBalance[expense.paidById] || 0) + expense.amount;
      expense.splits.forEach((split) => {
        netBalance[split.userId] =
          (netBalance[split.userId] || 0) - split.amount;
      });
    });

    // Subtract settlements: payer loses credit, receiver gains credit
    settlements.forEach((settlement) => {
      netBalance[settlement.fromUserId] =
        (netBalance[settlement.fromUserId] || 0) + settlement.amount;
      netBalance[settlement.toUserId] =
        (netBalance[settlement.toUserId] || 0) - settlement.amount;
    });

    // Build user map
    const userMap: {
      [id: string]: { name: string; avatar: string | null };
    } = {};
    members.forEach((m) => {
      userMap[m.userId] = { name: m.user.name, avatar: m.user.avatar };
    });

    // Greedy settlement algorithm
    const creditors: Array<{ id: string; amount: number }> = [];
    const debtors: Array<{ id: string; amount: number }> = [];

    Object.entries(netBalance).forEach(([uid, balance]) => {
      if (balance > 0.01) {
        creditors.push({ id: uid, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ id: uid, amount: -balance });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0,
      j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        const debt: SimplifiedDebt = {
          fromUserId: debtor.id,
          fromUserName: userMap[debtor.id]?.name || "Unknown",
          fromUserAvatar: userMap[debtor.id]?.avatar || null,
          toUserId: creditor.id,
          toUserName: userMap[creditor.id]?.name || "Unknown",
          toUserAvatar: userMap[creditor.id]?.avatar || null,
          amount: Math.round(amount * 100) / 100,
          groupId: group.id,
          groupName: group.name,
        };

        if (debtor.id === userId) {
          youOwe.push(debt);
        } else if (creditor.id === userId) {
          owedToYou.push(debt);
        }
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
  }

  const totalYouOwe = youOwe.reduce((sum, d) => sum + d.amount, 0);
  const totalOwedToYou = owedToYou.reduce((sum, d) => sum + d.amount, 0);

  return { youOwe, owedToYou, totalYouOwe, totalOwedToYou };
}

// GET /api/settlements - Get all debts for current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const debts = await calculateUserDebts(user.id);

    // Get pending confirmations (settlements awaiting user's confirmation as creditor)
    const pendingConfirmations = await prisma.settlement.findMany({
      where: {
        toUserId: user.id,
        status: "pending",
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get my pending payments (settlements I initiated that are awaiting confirmation)
    const myPendingPayments = await prisma.settlement.findMany({
      where: {
        fromUserId: user.id,
        status: "pending",
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get completed settlement history
    const settlements = await prisma.settlement.findMany({
      where: {
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
        status: "completed",
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Filter out debts that already have a pending settlement
    // to avoid showing the same debt in both "You Owe" and "Awaiting Confirmation"
    // Use integer comparison (satang) to avoid float precision issues
    const filteredYouOwe = debts.youOwe.filter((debt) => {
      const hasPending = myPendingPayments.some(
        (p) =>
          p.toUserId === debt.toUserId &&
          p.groupId === debt.groupId &&
          Math.round(p.amount * 100) === Math.round(debt.amount * 100),
      );
      return !hasPending;
    });

    // Similarly filter owedToYou for debts that already have pending confirmations
    const filteredOwedToYou = debts.owedToYou.filter((debt) => {
      const hasPending = pendingConfirmations.some(
        (p) =>
          p.fromUserId === debt.fromUserId &&
          p.groupId === debt.groupId &&
          Math.round(p.amount * 100) === Math.round(debt.amount * 100),
      );
      return !hasPending;
    });

    return NextResponse.json({
      youOwe: filteredYouOwe,
      owedToYou: filteredOwedToYou,
      totalYouOwe: filteredYouOwe.reduce((sum, d) => sum + d.amount, 0),
      totalOwedToYou: filteredOwedToYou.reduce((sum, d) => sum + d.amount, 0),
      currentUserId: user.id,
      pendingConfirmations,
      myPendingPayments,
      settlements,
    });
  } catch (error) {
    console.error("Get settlements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/settlements - Create a settlement (mark as paid, pending confirmation)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, amount, groupId, note } = body;

    if (!toUserId || !amount || !groupId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify both users are in the group
    const memberships = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: [user.id, toUserId] },
      },
    });

    if (memberships.length !== 2) {
      return NextResponse.json(
        { error: "Both users must be members of the group" },
        { status: 400 },
      );
    }

    // Create settlement record with PENDING status (needs creditor confirmation)
    const settlement = await prisma.settlement.create({
      data: {
        fromUserId: user.id,
        toUserId,
        amount: parseFloat(amount),
        groupId,
        note,
        status: "pending", // Awaiting creditor confirmation
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ settlement });
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/settlements - Confirm or reject a pending settlement
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settlementId, action } = body;

    if (!settlementId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get the settlement
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      return NextResponse.json(
        { error: "Settlement not found" },
        { status: 404 },
      );
    }

    // Only the creditor (toUserId) can confirm or reject
    if (settlement.toUserId !== user.id) {
      return NextResponse.json(
        { error: "Only the creditor can confirm payment" },
        { status: 403 },
      );
    }

    if (settlement.status !== "pending") {
      return NextResponse.json(
        { error: "Settlement is not pending" },
        { status: 400 },
      );
    }

    if (action === "confirm") {
      // Mark as completed
      const updated = await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: "completed",
          paidAt: new Date(),
        },
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
          group: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ settlement: updated });
    } else if (action === "reject") {
      // Delete the settlement
      await prisma.settlement.delete({
        where: { id: settlementId },
      });
      return NextResponse.json({ message: "Settlement rejected" });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'confirm' or 'reject'" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Update settlement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
