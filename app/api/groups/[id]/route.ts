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
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bankName: true,
                bankAccount: true,
                qrCodeUrl: true,
              },
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
        settlements: {
          where: { status: "completed" },
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

    // Process settlements (completed payments between users)
    for (const settlement of group.settlements) {
      // Payer's balance goes up (they paid off debt)
      memberBalances.set(
        settlement.fromUserId,
        (memberBalances.get(settlement.fromUserId) || 0) + settlement.amount,
      );
      // Receiver's balance goes down (they received payment)
      memberBalances.set(
        settlement.toUserId,
        (memberBalances.get(settlement.toUserId) || 0) - settlement.amount,
      );
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
        bankName: m.user.bankName,
        bankAccount: m.user.bankAccount,
        qrCodeUrl: m.user.qrCodeUrl,
      };
    });

    // Calculate debts using direct debt tracking with pass-through optimization
    // Step 1: Build a matrix of who owes whom directly from expenses
    const debtMatrix: Map<string, Map<string, number>> = new Map();

    // Initialize the matrix for all members
    for (const member of group.members) {
      debtMatrix.set(member.userId, new Map());
    }

    // Process each expense to build direct debts
    for (const expense of group.expenses) {
      const payerId = expense.paidById;

      for (const split of expense.splits) {
        if (!split.settled && split.userId !== payerId) {
          // This person owes the payer
          const currentDebt = debtMatrix.get(split.userId)?.get(payerId) || 0;
          debtMatrix
            .get(split.userId)
            ?.set(payerId, currentDebt + split.amount);
        }
      }
    }

    // Process settlements - they reduce debts
    for (const settlement of group.settlements) {
      const fromId = settlement.fromUserId;
      const toId = settlement.toUserId;

      // Settlement reduces what 'from' owes to 'to'
      const currentDebt = debtMatrix.get(fromId)?.get(toId) || 0;
      const newDebt = currentDebt - settlement.amount;

      if (newDebt > 0) {
        debtMatrix.get(fromId)?.set(toId, newDebt);
      } else if (newDebt < 0) {
        // Overpaid - now 'to' owes 'from'
        debtMatrix.get(fromId)?.set(toId, 0);
        const reverseDebt = debtMatrix.get(toId)?.get(fromId) || 0;
        debtMatrix.get(toId)?.set(fromId, reverseDebt + Math.abs(newDebt));
      } else {
        debtMatrix.get(fromId)?.set(toId, 0);
      }
    }

    // Step 2: Simplify by netting mutual debts (if A owes B and B owes A, net them)
    for (const [debtorId, creditors] of debtMatrix) {
      for (const [creditorId, amount] of creditors) {
        if (amount > 0) {
          const reverseAmount = debtMatrix.get(creditorId)?.get(debtorId) || 0;
          if (reverseAmount > 0) {
            // Net the debts
            if (amount > reverseAmount) {
              debtMatrix.get(debtorId)?.set(creditorId, amount - reverseAmount);
              debtMatrix.get(creditorId)?.set(debtorId, 0);
            } else {
              debtMatrix.get(debtorId)?.set(creditorId, 0);
              debtMatrix.get(creditorId)?.set(debtorId, reverseAmount - amount);
            }
          }
        }
      }
    }

    // Step 3: Pass-through optimization
    // If A owes B, and B owes C, route some of A's debt directly to C
    let optimized = true;
    const maxIterations = 10; // Prevent infinite loops
    let iterations = 0;

    while (optimized && iterations < maxIterations) {
      optimized = false;
      iterations++;

      for (const [debtorId, creditors] of debtMatrix) {
        for (const [creditorId, amount] of creditors) {
          if (amount <= 0.01) continue;

          // Check if creditor owes someone else
          const creditorDebts = debtMatrix.get(creditorId);
          if (!creditorDebts) continue;

          for (const [finalCreditorId, creditorDebtAmount] of creditorDebts) {
            if (creditorDebtAmount <= 0.01) continue;
            if (finalCreditorId === debtorId) continue; // Skip circular

            // Pass through: A pays C directly instead of A → B → C
            const passAmount = Math.min(amount, creditorDebtAmount);

            if (passAmount > 0.01) {
              // Reduce A → B
              debtMatrix.get(debtorId)?.set(creditorId, amount - passAmount);
              // Reduce B → C
              debtMatrix
                .get(creditorId)
                ?.set(finalCreditorId, creditorDebtAmount - passAmount);
              // Increase A → C
              const currentAtoC =
                debtMatrix.get(debtorId)?.get(finalCreditorId) || 0;
              debtMatrix
                .get(debtorId)
                ?.set(finalCreditorId, currentAtoC + passAmount);

              optimized = true;
              break;
            }
          }
          if (optimized) break;
        }
        if (optimized) break;
      }
    }

    // Step 4: Build final debts array
    const debts: Array<{
      from: string;
      fromId: string;
      fromBalance: number;
      to: string;
      toId: string;
    }> = [];

    // Create name lookup
    const nameById = new Map<string, string>();
    for (const member of group.members) {
      nameById.set(member.userId, member.user.name);
    }

    for (const [debtorId, creditors] of debtMatrix) {
      for (const [creditorId, amount] of creditors) {
        if (amount > 0.01) {
          debts.push({
            from: nameById.get(debtorId) || "Unknown",
            fromId: debtorId,
            fromBalance: Math.round(amount * 100) / 100,
            to: nameById.get(creditorId) || "Unknown",
            toId: creditorId,
          });
        }
      }
    }

    // Sort debts by amount (highest first)
    debts.sort((a, b) => b.fromBalance - a.fromBalance);

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
