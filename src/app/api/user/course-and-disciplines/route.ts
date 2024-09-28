import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const email = await getSessionEmail(request);
    
    if (!email) {
      return NextResponse.json({ error: "Email not found in session" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        course: { select: { id: true, name: true } },
        completedDisciplines: {
          select: {
            discipline: true,
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
