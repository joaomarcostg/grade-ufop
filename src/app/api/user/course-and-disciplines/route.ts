import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        course: { select: { id: true, name: true } },
        completedDisciplines: {
          select: {
            disciplineId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { course, completedDisciplines } = user;
    return NextResponse.json({
      data: {
        course,
        completedDisciplines,
      },
    });
  } catch (error) {
    console.error("Error fetching user course and disciplines:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
