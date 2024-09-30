import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { disciplineId } = await request.json();
    await prisma.completedDiscipline.create({
      data: {
        userId: params.userId,
        disciplineId,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        course: { select: { id: true, name: true } },
        completedDisciplines: {
          include: { discipline: true },
        },
      },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("Error adding completed discipline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const email = await getSessionEmail(request);

  if (!email) {
    return NextResponse.json(
      { error: "Email not found in session" },
      { status: 400 }
    );
  }

  const { disciplineIds } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove all existing completed disciplines
    await prisma.completedDiscipline.deleteMany({
      where: { userId: user.id },
    });

    const selectedDisciplines = await prisma.discipline.findMany({
      where: {
        id: {
          in: disciplineIds,
        },
      },
    });

    const equivalencyGroups = selectedDisciplines
      .map((s) => s.equivalencyGroupId)
      .filter((val) => val !== null);

    const equivalentDisciplines = await prisma.discipline.findMany({
      where: {
        equivalencyGroupId: {
          in: equivalencyGroups,
        },
      },
    });

    const coursedDisciplineIds = [
      ...disciplineIds,
      ...equivalentDisciplines.map((d) => d.id),
    ];

    const completedDisciplineSet = new Set(coursedDisciplineIds);

    // Add new completed disciplines
    await prisma.completedDiscipline.createMany({
      data: Array.from(completedDisciplineSet).map((disciplineId: string) => ({
        userId: user.id,
        disciplineId,
      })),
    });

    const updatedUser = await prisma.user.findUnique({
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating coursed disciplines:", error);
    return NextResponse.json(
      { error: "Failed to update coursed disciplines" },
      { status: 500 }
    );
  }
}
