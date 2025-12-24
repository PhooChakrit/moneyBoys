import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id] - Get group details with members, expenses, balances
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is a member of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    // Get group with all details
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        expenses: {
          include: {
            paidBy: {
              select: { id: true, name: true },
            },
            splits: true,
          },
          orderBy: { date: "desc" },
          take: 20,
        },
        _count: {
          select: { members: true, expenses: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Calculate member balances
    const memberBalances = new Map<string, number>();
    for (const member of group.members) {
      memberBalances.set(member.userId, 0);
    }

    // Process expenses to calculate balances
    for (const expense of group.expenses) {
      // Add to payer's balance (they are owed money)
      memberBalances.set(
        expense.paidById,
        (memberBalances.get(expense.paidById) || 0) + expense.amount,
      );

      // Subtract from each split participant (they owe money)
      for (const split of expense.splits) {
        if (!split.settled) {
          memberBalances.set(
            split.userId,
            (memberBalances.get(split.userId) || 0) - split.amount,
          );
        }
      }
    }

    // Build member details with balances
    const memberDetails = group.members.map((m) => {
      const balance = memberBalances.get(m.userId) || 0;
      return {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        balance,
        initials: m.user.name.charAt(0).toUpperCase(),
      };
    });

    // Calculate debts (simplified: who owes whom)
    const debts: Array<{
      from: string;
      fromId: string;
      fromBalance: number;
      to: string;
      toId: string;
    }> = [];

    const sortedMembers = [...memberDetails].sort(
      (a, b) => a.balance - b.balance,
    );

    // Simple debt calculation: pair up people with negative and positive balances
    let debtorIdx = 0;
    let creditorIdx = sortedMembers.length - 1;

    while (debtorIdx < creditorIdx) {
      const debtor = sortedMembers[debtorIdx];
      const creditor = sortedMembers[creditorIdx];

      if (debtor.balance >= 0) break;
      if (creditor.balance <= 0) break;

      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      if (amount > 0) {
        debts.push({
          from: debtor.name,
          fromId: debtor.id,
          fromBalance: amount,
          to: creditor.name,
          toId: creditor.id,
        });
      }

      if (Math.abs(debtor.balance) <= creditor.balance) {
        debtorIdx++;
      } else {
        creditorIdx--;
      }
    }

    // Format transactions
    const transactions = group.expenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      currency: expense.currency,
      paidBy: expense.paidBy.name,
      paidById: expense.paidBy.id,
      date: expense.date.toISOString(),
      participants: expense.splits.map((s) => {
        const member = group.members.find((m) => m.userId === s.userId);
        return member?.user.name.charAt(0).toUpperCase() || "?";
      }),
    }));

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        memberCount: group._count.members,
        expenseCount: group._count.expenses,
        createdAt: group.createdAt,
        role: membership.role,
      },
      members: memberDetails,
      transactions,
      debts,
    });
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/groups/[id] - Update group
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: id,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update the group" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, description } = body;

    const updateData: { name?: string; description?: string | null } = {};

    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json(
          { error: "Group name cannot be empty" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: id,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete the group" },
        { status: 403 },
      );
    }

    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
