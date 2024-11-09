import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";
import { UserScheduleCombinations } from "@/app/context/student/types";
import { DayOfWeek } from "@/app/context/filter/types";

// export const revalidate = 3600;

const formatTime = (time: Date): string => {
  const hours = time.getUTCHours().toString().padStart(2, "0");
  const minutes = time.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

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
      include: {
        course: true,
        completedDisciplines: {
          include: {
            discipline: true,
          },
        },
        schedules: {
          include: {
            classes: {
              include: {
                disciplineClass: {
                  include: {
                    discipline: true,
                    schedules: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const scheduleCombinations: UserScheduleCombinations = {};

    user.schedules.forEach((schedule) => {
      if (!scheduleCombinations[schedule.semester]) {
        scheduleCombinations[schedule.semester] = {};
      }

      scheduleCombinations[schedule.semester][schedule.id] = {};

      schedule.classes.forEach((scheduleClass) => {
        const disciplineClass = scheduleClass.disciplineClass;
        const discipline = disciplineClass.discipline;

        scheduleCombinations[schedule.semester][schedule.id][
          disciplineClass.id
        ] = {
          code: discipline.code,
          name: discipline.name,
          professor: disciplineClass.professor ?? "",
          classNumber: disciplineClass.classNumber ?? "",
          schedule: disciplineClass.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek as DayOfWeek,
            startTime: formatTime(s.startTime),
          })),
        };
      });
    });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      course: user.course,
      coursedDisciplines: user.completedDisciplines.map((cd) => cd.discipline),
      scheduleCombinations,
    };

    return NextResponse.json({ data: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
