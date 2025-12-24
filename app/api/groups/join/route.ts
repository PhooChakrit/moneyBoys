import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/groups/join - Join a group using invite code or link
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode, groupId } = body;

    // Find group by invite code or group ID
    let group;
    if (inviteCode) {
      group = await prisma.group.findUnique({
        where: { inviteCode: inviteCode.toUpperCase() },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          _count: { select: { members: true } },
        },
      });
    } else if (groupId) {
      group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
          _count: { select: { members: true } },
        },
      });
    }

    if (!group) {
      return NextResponse.json(
        { error: "Invalid invite code or group not found" },
        { status: 404 },
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 },
      );
    }

    // Add user to group
    await prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role: "member",
      },
    });

    return NextResponse.json({
      message: "Successfully joined the group",
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        members: group._count.members + 1,
        avatars: [
          ...group.members.map((m) => m.user.name.charAt(0).toUpperCase()),
          user.name.charAt(0).toUpperCase(),
        ],
      },
    });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
