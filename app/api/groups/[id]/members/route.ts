import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/groups/[id]/members - Add a member to the group
export async function POST(request: Request, { params }: RouteParams) {
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
        { error: "Only admins can add members" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 },
      );
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUser.id,
          groupId: id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 },
      );
    }

    // Add member
    const newMember = await prisma.groupMember.create({
      data: {
        userId: targetUser.id,
        groupId: id,
        role: "member",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Member added successfully",
        member: {
          id: newMember.user.id,
          name: newMember.user.name,
          email: newMember.user.email,
          avatar: newMember.user.avatar,
          role: newMember.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/groups/[id]/members - Remove a member from the group
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let memberId = searchParams.get("memberId");

    // Support "self" as a shortcut for current user
    if (memberId === "self") {
      memberId = user.id;
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 },
      );
    }

    // Check if user is admin of this group or removing themselves
    const userMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: id,
        },
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 },
      );
    }

    const isRemovingSelf = memberId === user.id;
    const isAdmin = userMembership.role === "admin";

    if (!isRemovingSelf && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can remove other members" },
        { status: 403 },
      );
    }

    // Find the member to remove
    const memberToRemove = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: memberId,
          groupId: id,
        },
      },
    });

    if (!memberToRemove) {
      return NextResponse.json(
        { error: "Member not found in this group" },
        { status: 404 },
      );
    }

    // Prevent removing the last admin
    if (memberToRemove.role === "admin") {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId: id,
          role: "admin",
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "Cannot remove the last admin. Transfer admin rights first.",
          },
          { status: 400 },
        );
      }
    }

    // Remove member
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: memberId,
          groupId: id,
        },
      },
    });

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
