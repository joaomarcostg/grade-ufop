import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionEmail } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const email = await getSessionEmail(request);

  if (!email) {
    return NextResponse.json(
      { error: "Email not found in session" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Save the generated combinations
    const userSavedSchedules = await prisma.schedule.findMany({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json(
      { schedules: userSavedSchedules },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error while getting combinations:", error);
    return NextResponse.json(
      { message: "Error while getting combinations" },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  const email = await getSessionEmail(request);

  if (!email) {
    return NextResponse.json(
      { error: "Email not found in session" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { semester, disciplineClassIds } = await request.json();

  try {
    // Save the generated combinations
    const savedSchedule = await prisma.schedule.create({
      data: {
        userId: user?.id,
        semester: semester,
        name: `Schedule for ${semester}`,
        classes: {
          createMany: {
            data: disciplineClassIds.map((id: string) => ({
              disciplineClassId: id,
            })),
          },
        },
      },
    });

    return NextResponse.json(
      { schedule: savedSchedule },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error while saving combinations:", error);
    return NextResponse.json(
      { message: "Error while saving combinations" },
      {
        status: 500,
      }
    );
  }
}
