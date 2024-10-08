import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const email = await getSessionEmail(request);

  if (!email) {
    return NextResponse.json({ error: "Email not found in session" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        course: true,
        completedDisciplines: {
          include: {
            discipline: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      course: user.course,
      coursedDisciplines: user.completedDisciplines.map((cd) => ({
        id: cd.discipline.id,
        name: cd.discipline.name,
      })),
      savedCombinations: [], // Placeholder for future implementation
    };

    return NextResponse.json({ data: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
