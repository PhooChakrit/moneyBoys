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

    // Convert amount to satang (integer) for precise calculation
    const amountInSatang = Math.round(parseFloat(amount) * 100);
    const totalShares = splits.reduce(
      (sum: number, s: { share: number }) => sum + s.share,
      0,
    );

    // Calculate splits in satang, distribute remainder to first split
    let remainingSatang = amountInSatang;
    const splitAmounts: number[] = [];

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      if (i === splits.length - 1) {
        // Last split gets the remainder to ensure total equals amount
        splitAmounts.push(remainingSatang);
      } else {
        const splitSatang = Math.round(
          (amountInSatang * split.share) / totalShares,
        );
        splitAmounts.push(splitSatang);
        remainingSatang -= splitSatang;
      }
    }

    // Create expense with splits (convert back to baht)
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: amountInSatang / 100,
        paidById,
        groupId,
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

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
