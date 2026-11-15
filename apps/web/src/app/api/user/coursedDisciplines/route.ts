import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

// export const revalidate = 3600;

export async function POST(request: NextRequest) {
  try {
    const email = await getSessionEmail(request);

    if (!email) {
      return NextResponse.json(
        { error: "Email not found in session" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { disciplineIds } = await request.json();

    if (!Array.isArray(disciplineIds)) {
      return NextResponse.json(
        { error: "Invalid disciplineIds: must be an array" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // Delete all existing completed disciplines for the user
      await prisma.completedDiscipline.deleteMany({
        where: { userId: user.id },
      });

      // Create new completed disciplines
      if (disciplineIds.length > 0) {
        await prisma.completedDiscipline.createMany({
          data: disciplineIds.map((disciplineId: string) => ({
            userId: user.id,
            disciplineId: disciplineId,
          })),
          skipDuplicates: true,
        });
      }

      // Fetch the updated user data
      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          course: { select: { id: true, name: true } },
          completedDisciplines: {
            include: { discipline: true },
          },
        },
      });
    });

    if (!updatedUser) {
      throw new Error("Failed to update user data");
    }

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("Error replacing completed disciplines:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}