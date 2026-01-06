import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is OAuth user (no password = Google login)
    const fullUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { password: true },
    });
    const isOAuthUser = !fullUser?.password;

    const body = await request.json();
    const { name, email, avatar, password } = body;

    // Build update data
    const updateData: {
      name?: string;
      email?: string;
      avatar?: string;
      password?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    // Block email changes for OAuth users
    if (email !== undefined) {
      if (isOAuthUser) {
        return NextResponse.json(
          { error: "OAuth users cannot change their email" },
          { status: 403 },
        );
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id: currentUser.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 },
        );
      }

      updateData.email = email.toLowerCase();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Block password changes for OAuth users
    if (password !== undefined) {
      if (isOAuthUser) {
        return NextResponse.json(
          { error: "OAuth users cannot set a password" },
          { status: 403 },
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 },
        );
      }
      updateData.password = await hashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
