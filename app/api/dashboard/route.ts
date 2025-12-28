import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all user's group IDs first
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        group: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: { id: true, name: true },
                },
              },
              take: 4,
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const groupIds = groupMemberships.map((m) => m.group.id);

    // Skip expensive queries if user has no groups
    if (groupIds.length === 0) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        groups: [],
        recentExpenses: [],
        settlements: [],
        summary: {
          totalBalance: 0,
          youAreOwed: 0,
          youOwe: 0,
          netBalance: 0,
        },
      });
    }

    // Batch query: Get all expenses paid by user across all groups
    const userPaidByGroup = await prisma.expense.groupBy({
      by: ["groupId"],
      where: {
        groupId: { in: groupIds },
        paidById: user.id,
      },
      _sum: { amount: true },
    });

    // Batch query: Get all expense splits for user across all groups
    const userOwesByGroup = await prisma.expenseSplit.groupBy({
      by: ["expenseId"],
      where: {
        expense: { groupId: { in: groupIds } },
        userId: user.id,
        settled: false,
      },
      _sum: { amount: true },
    });

    // Get expense details to map back to groups
    const expenseIds = userOwesByGroup.map((e) => e.expenseId);
    const expenses = await prisma.expense.findMany({
      where: { id: { in: expenseIds } },
      select: { id: true, groupId: true },
    });

    // Create lookup maps
    const paidByGroupMap = new Map(
      userPaidByGroup.map((p) => [p.groupId, p._sum.amount || 0]),
    );

    const expenseToGroupMap = new Map(expenses.map((e) => [e.id, e.groupId]));

    // Calculate owes by group
    const owesByGroupMap = new Map<string, number>();
    for (const split of userOwesByGroup) {
      const groupId = expenseToGroupMap.get(split.expenseId);
      if (groupId) {
        owesByGroupMap.set(
          groupId,
          (owesByGroupMap.get(groupId) || 0) + (split._sum.amount || 0),
        );
      }
    }

    // Get completed settlements (payments already made)
    const completedSettlements = await prisma.settlement.findMany({
      where: {
        groupId: { in: groupIds },
        status: "completed",
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
      select: { groupId: true, fromUserId: true, toUserId: true, amount: true },
    });

    // Calculate settlement impact by group
    const settlementByGroupMap = new Map<string, number>();
    for (const settlement of completedSettlements) {
      const currentBalance = settlementByGroupMap.get(settlement.groupId) || 0;
      if (settlement.fromUserId === user.id) {
        // User paid someone - reduces what they owe
        settlementByGroupMap.set(
          settlement.groupId,
          currentBalance + settlement.amount,
        );
      } else {
        // User received payment - reduces what they're owed
        settlementByGroupMap.set(
          settlement.groupId,
          currentBalance - settlement.amount,
        );
      }
    }

    // Build groups with calculated balances
    const groups = groupMemberships.map((membership) => {
      const group = membership.group;
      const paid = paidByGroupMap.get(group.id) || 0;
      const owes = owesByGroupMap.get(group.id) || 0;
      const settlementAdjustment = settlementByGroupMap.get(group.id) || 0;
      const balance = paid - owes + settlementAdjustment;

      return {
        id: group.id,
        name: group.name,
        members: group.members.length,
        balance,
        avatars: group.members.map((m) => m.user.name.charAt(0).toUpperCase()),
        role: membership.role,
      };
    });

    // Get recent expenses across all user's groups
    const recentExpenses = await prisma.expense.findMany({
      where: {
        groupId: { in: groupIds },
      },
      include: {
        paidBy: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get pending settlements for the user
    const pendingSettlements = await prisma.settlement.findMany({
      where: {
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
        status: "pending",
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalBalance = groups.reduce((sum, g) => sum + g.balance, 0);
    const youAreOwed = pendingSettlements
      .filter((s) => s.toUserId === user.id)
      .reduce((sum, s) => sum + s.amount, 0);
    const youOwe = pendingSettlements
      .filter((s) => s.fromUserId === user.id)
      .reduce((sum, s) => sum + s.amount, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      groups,
      recentExpenses: recentExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        paidBy: e.paidBy.name,
        paidById: e.paidBy.id,
        avatar: e.paidBy.name.charAt(0).toUpperCase(),
        date: e.date.toISOString(),
        groupId: e.group.id,
        groupName: e.group.name,
      })),
      settlements: pendingSettlements.map((s) => ({
        id: s.id,
        from: s.fromUser.name,
        fromId: s.fromUser.id,
        to: s.toUser.name,
        toId: s.toUser.id,
        amount: s.amount,
        status: s.status,
        groupName: s.group.name,
      })),
      summary: {
        totalBalance,
        youAreOwed,
        youOwe,
        netBalance: youAreOwed - youOwe,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
