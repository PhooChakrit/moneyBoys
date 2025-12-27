import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, title, amount, paidById, splits } = body;

    // Validate required fields
    if (!groupId || !title || !amount || !paidById || !splits?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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

    // Create expense with splits
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        paidById,
        groupId,
        splits: {
          create: splits.map((split: { userId: string; share: number }) => ({
            userId: split.userId,
            amount:
              (parseFloat(amount) * split.share) /
              splits.reduce(
                (sum: number, s: { share: number }) => sum + s.share,
                0,
              ),
            share: split.share,
          })),
        },
      },
      include: {
        splits: true,
        paidBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
