import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Generate a short invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/groups - Get all groups for current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all groups where user is a member
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
              take: 5,
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // Calculate balances for each group
    const groupIds = groupMemberships.map((m) => m.group.id);

    // Get expenses paid by user
    const userPaidByGroup = await prisma.expense.groupBy({
      by: ["groupId"],
      where: {
        groupId: { in: groupIds },
        paidById: user.id,
      },
      _sum: { amount: true },
    });

    // Get expense splits for user
    const userSplitsByExpense = await prisma.expenseSplit.findMany({
      where: {
        expense: { groupId: { in: groupIds } },
        userId: user.id,
        settled: false,
      },
      include: {
        expense: { select: { groupId: true } },
      },
    });

    // Create lookup maps
    const paidByGroupMap = new Map(
      userPaidByGroup.map((p) => [p.groupId, p._sum.amount || 0]),
    );

    const owesByGroupMap = new Map<string, number>();
    for (const split of userSplitsByExpense) {
      const groupId = split.expense.groupId;
      owesByGroupMap.set(
        groupId,
        (owesByGroupMap.get(groupId) || 0) + split.amount,
      );
    }

    // Get completed settlements (payments made)
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

    // Build response
    const groups = groupMemberships.map((membership) => {
      const group = membership.group;
      const paid = paidByGroupMap.get(group.id) || 0;
      const owes = owesByGroupMap.get(group.id) || 0;
      const settlementAdjustment = settlementByGroupMap.get(group.id) || 0;
      const balance = paid - owes + settlementAdjustment;

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        members: group._count.members,
        balance,
        avatars: group.members.map((m) => m.user.name.charAt(0).toUpperCase()),
        memberDetails: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatar: m.user.avatar,
          role: m.role,
        })),
        role: membership.role,
        createdAt: group.createdAt,
      };
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.group.findUnique({
        where: { inviteCode },
      });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // Create group and add creator as admin
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        inviteCode,
        members: {
          create: {
            userId: user.id,
            role: "admin",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Group created successfully",
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          inviteCode: group.inviteCode,
          members: group._count.members,
          avatars: group.members.map((m) =>
            m.user.name.charAt(0).toUpperCase(),
          ),
          memberDetails: group.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
            role: m.role,
          })),
          role: "admin",
          balance: 0,
          createdAt: group.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
