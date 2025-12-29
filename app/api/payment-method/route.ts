import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        bankName: true,
        bankAccount: true,
        qrCodeUrl: true,
      },
    });

    return NextResponse.json({ paymentMethod: userData });
  } catch (error) {
    console.error("Get payment method error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bankName, bankAccount, qrCodeUrl } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        qrCodeUrl: qrCodeUrl || null,
      },
      select: {
        bankName: true,
        bankAccount: true,
        qrCodeUrl: true,
      },
    });

    return NextResponse.json({ paymentMethod: updatedUser });
  } catch (error) {
    console.error("Update payment method error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
