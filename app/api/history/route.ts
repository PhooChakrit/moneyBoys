import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/history - Get all history (expenses + settlements) for current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all user's groups
    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) {
      return NextResponse.json({
        currentUserId: user.id,
        timeline: [],
      });
    }

    // Get all expenses from user's groups
    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        paidBy: { select: { id: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
        splits: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Get all settlements from user's groups
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: { in: groupIds },
      },
      include: {
        fromUser: { select: { id: true, name: true, avatar: true } },
        toUser: { select: { id: true, name: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Create timeline combining expenses and settlements
    const timeline = [
      ...expenses.map((e) => ({
        type: "expense" as const,
        id: e.id,
        date: e.createdAt.toISOString(),
        title: e.title,
        amount: e.amount,
        groupId: e.group.id,
        groupName: e.group.name,
        paidBy: e.paidBy.name,
        paidById: e.paidBy.id,
        paidByAvatar: e.paidBy.avatar,
        participantCount: e.splits.length,
        isUserPayer: e.paidById === user.id,
        userShare: e.splits.find((s) => s.userId === user.id)?.amount || 0,
      })),
      ...settlements.map((s) => ({
        type: "settlement" as const,
        id: s.id,
        date: s.createdAt.toISOString(),
        amount: s.amount,
        status: s.status,
        groupId: s.group.id,
        groupName: s.group.name,
        fromUser: s.fromUser.name,
        fromUserId: s.fromUser.id,
        fromUserAvatar: s.fromUser.avatar,
        toUser: s.toUser.name,
        toUserId: s.toUser.id,
        toUserAvatar: s.toUser.avatar,
        isUserPayer: s.fromUserId === user.id,
        isUserReceiver: s.toUserId === user.id,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      currentUserId: user.id,
      timeline,
    });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
