import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/groups/preview - Preview group info without joining (for confirmation modal)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get("code");
    const groupId = searchParams.get("id");

    if (!inviteCode && !groupId) {
      return NextResponse.json(
        { error: "Invite code or group ID is required" },
        { status: 400 }
      );
    }

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
            take: 5,
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
            take: 5,
          },
          _count: { select: { members: true } },
        },
      });
    }

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: group._count.members,
        members: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatar: m.user.avatar,
        })),
        avatars: group.members.map((m) => m.user.name.charAt(0).toUpperCase()),
      },
    });
  } catch (error) {
    console.error("Preview group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
