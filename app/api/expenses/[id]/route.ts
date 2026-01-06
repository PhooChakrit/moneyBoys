import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/expenses/[id] - Get expense details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        paidBy: {
          select: { id: true, name: true, avatar: true },
        },
        splits: true,
        group: {
          select: { id: true, name: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Get expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if user is the payer or an admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    const isPayer = expense.paidById === user.id;
    const isAdmin = membership.role === "admin";
    const isStaff = membership.role === "staff";
    const canMemberEdit = expense.group.allowMemberEdit;

    // Allow edit if: payer, admin, staff, or (member AND allowMemberEdit is true)
    if (!isPayer && !isAdmin && !isStaff && !canMemberEdit) {
      return NextResponse.json(
        { error: "Only the payer or admin can edit this expense" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { title, amount, paidById, splits } = body;

    // Update expense and splits in a transaction
    const updatedExpense = await prisma.$transaction(async (tx) => {
      // Delete existing splits
      await tx.expenseSplit.deleteMany({
        where: { expenseId: id },
      });

      // Update expense with new splits
      const amountInSatang = Math.round(parseFloat(amount) * 100);
      const totalShares = splits.reduce(
        (sum: number, s: { share: number }) => sum + s.share,
        0,
      );

      let remainingSatang = amountInSatang;
      const splitAmounts: number[] = [];

      for (let i = 0; i < splits.length; i++) {
        const split = splits[i];
        if (i === splits.length - 1) {
          splitAmounts.push(remainingSatang);
        } else {
          const splitSatang = Math.round(
            (amountInSatang * split.share) / totalShares,
          );
          splitAmounts.push(splitSatang);
          remainingSatang -= splitSatang;
        }
      }

      return tx.expense.update({
        where: { id },
        data: {
          title,
          amount: amountInSatang / 100,
          paidById,
          splits: {
            create: splits.map(
              (split: { userId: string; share: number }, index: number) => ({
                userId: split.userId,
                amount: splitAmounts[index] / 100,
                share: split.share,
              }),
            ),
          },
        },
        include: {
          splits: true,
          paidBy: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });
    });

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { group: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if user is the payer or an admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: expense.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    const isPayer = expense.paidById === user.id;
    const isAdmin = membership.role === "admin";
    const isStaff = membership.role === "staff";
    const canMemberEdit = expense.group.allowMemberEdit;

    // Allow delete if: payer, admin, staff, or (member AND allowMemberEdit is true)
    if (!isPayer && !isAdmin && !isStaff && !canMemberEdit) {
      return NextResponse.json(
        { error: "Only the payer or admin can delete this expense" },
        { status: 403 },
      );
    }

    // Delete expense (splits will cascade delete)
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
