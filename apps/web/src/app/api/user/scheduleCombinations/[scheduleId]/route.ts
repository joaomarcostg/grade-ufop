import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

// export const revalidate = 3600;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { scheduleId } = params;

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (prisma) => {
      // Delete associated ScheduleClass records
      await prisma.scheduleClass.deleteMany({
        where: {
          scheduleId: scheduleId,
        },
      });

      // Delete the Schedule
      const deletedSchedule = await prisma.schedule.delete({
        where: {
          id: scheduleId,
          userId: user.id,
        },
      });

      return deletedSchedule;
    });

    if (!result) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Schedule and associated classes removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while removing schedule:", error);
    return NextResponse.json(
      { message: "Error while removing schedule" },
      { status: 500 }
    );
  }
}
