import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

// export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const email = await getSessionEmail(request);

  if (!email) {
    return NextResponse.json(
      { error: "Email not found in session" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { disciplineClassIds } = (await request.json()) as {
      disciplineClassIds: string[];
    };
    const semester = process.env.NEXT_PUBLIC_CURRENT_SEMESTER;

    if (!semester) {
      return NextResponse.json(
        { message: "Semester not found" },
        {
          status: 500,
        }
      );
    }

    // Save the generated combination
    const savedSchedule = await prisma.schedule.create({
      data: {
        userId: user?.id,
        semester,
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
      { data: savedSchedule },
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
