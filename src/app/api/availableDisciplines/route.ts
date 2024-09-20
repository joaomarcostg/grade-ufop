import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionEmail } from "@/lib/auth";

type UserInfo = {
  courseId: string;
  completedDisciplines: string[];
};

type FilterParams = {
  timeSlots?: {
    startTime: Date;
    endTime: Date;
  }[];
  days?: string[];
  includeOtherCourses?: boolean;
};

function toDateTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: ${time}. Expected format is HH:MM.`);
  }

  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes));
  return date;
}

function getTimesSlots(timeSlots: string | null) {
  if (!timeSlots) {
    return [];
  }

  return timeSlots.split(",").map((timeSlot) => {
    const [start, end] = timeSlot.split("-");
    return {
      startTime: toDateTime(start),
      endTime: toDateTime(end),
    };
  });
}

export async function GET(request: NextRequest) {
  const session = await getSessionEmail(request);
  if (!session) {
    return NextResponse.json({ error: "Email not found in session" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;

  const timeSlots = getTimesSlots(searchParams.get("timeSlots"));

  const filterParams: FilterParams = {
    timeSlots,
    days: searchParams.get("days")?.split(","),
    includeOtherCourses: searchParams.get("includeOtherCourses") === "true",
  };

  const { courseId, completedDisciplines } = (await prisma.user.findUnique({
    where: { email: session },
    select: {
      courseId: true,
      completedDisciplines: {
        select: {
          disciplineId: true,
        },
      },
    },
  })) ?? {
    courseId: "",
    completedDisciplines: [],
  };

  if (!courseId) {
    return NextResponse.json({ error: "User course not found" }, { status: 404 });
  }

  const disciplineCourses = await getAvailableDisciplines({
    courseId,
    completedDisciplines: completedDisciplines.map((c) => c.disciplineId),
    filterParams,
  });

  return NextResponse.json({ data: disciplineCourses });
}

async function getPrerequisitesByDisciplineCourseId(disciplineCourseId: string) {
  const prerequisites = await prisma.prerequisite.findMany({
    where: {
      disciplineCourseId,
    },
    include: {
      prerequisiteDiscipline: true,
    },
  });

  return prerequisites.map((prerequisite) => ({
    id: prerequisite.id,
    discipline_id: prerequisite.disciplineCourseId,
    discipline: prerequisite.prerequisiteDiscipline,
  }));
}

async function getDisciplineCourseId(courseId: string, disciplineId: string) {
  const disciplineCourse = await prisma.disciplineCourse.findFirst({
    where: {
      courseId,
      disciplineId,
    },
  });

  return disciplineCourse?.id;
}

async function getDisciplinesForCourse(courseId: string, semester: string, filterParams: FilterParams) {
  const { days, timeSlots } = filterParams;

  const disciplines = await prisma.discipline.findMany({
    where: {
      courses: {
        some: {
          courseId: courseId,
        },
      },
      classes: {
        some: {
          semester: semester,
        },
      },
    },
    include: {
      courses: {
        where: {
          courseId: courseId,
        },
        select: {
          period: true,
        },
      },
      classes: {
        where: {
          semester: semester,
        },
        include: {
          schedules: true,
        },
      },
    },
  });

  // Post-processing to filter classes based on the given criteria
  const filteredDisciplines = disciplines
    .map((discipline) => {
      return {
        ...discipline,
        classes: discipline.classes.filter((classItem) => {
          // Check if all schedules of the class meet the criteria
          return classItem.schedules.every((schedule) => {
            const dayMatch = !days?.length || days.includes(schedule.dayOfWeek ?? "");
            const timeMatch =
              !timeSlots?.length || timeSlots.some((slot) => schedule.startTime >= slot.startTime && schedule.endTime <= slot.endTime);
            return dayMatch && timeMatch;
          });
        }),
      };
    })
    .filter((discipline) => discipline.classes.length > 0);
  
  return filteredDisciplines;
}
async function getAvailableDisciplines({ courseId, completedDisciplines, filterParams }: UserInfo & { filterParams: FilterParams }) {
  const availableDisciplines = [];
  const semester = process.env.NEXT_PUBLIC_CURRENT_SEMESTER ?? "2024/1";
  const disciplinesFromCourse = await getDisciplinesForCourse(courseId, semester, filterParams);

  for (const discipline of disciplinesFromCourse) {
    const isCoursed = completedDisciplines.includes(discipline.id);
    if (isCoursed) {
      continue;
    }

    const disciplineCourseId = await getDisciplineCourseId(courseId, discipline.id);

    if (!disciplineCourseId) {
      continue;
    }

    const prerequisites = await getPrerequisitesByDisciplineCourseId(disciplineCourseId);

    const prerequisitesMet = prerequisites.every((prerequisite) => completedDisciplines.includes(prerequisite.discipline_id ?? ""));

    if (!isCoursed && prerequisitesMet) {
      availableDisciplines.push({
        id: discipline.id,
        code: discipline.code,
        name: discipline.name,
        isEnabled: true,
        period: discipline.courses[0]?.period,
        classes: discipline.classes,
      });
    }
  }

  availableDisciplines.sort((a, b) => {
    const periodA = a.period || 0;
    const periodB = b.period || 0;

    if (periodA === 0) return 1;
    if (periodB === 0) return -1;

    if (periodA === periodB) {
      const codeA = a.code || "";
      const codeB = b.code || "";
      return codeA.localeCompare(codeB);
    }

    return periodA - periodB;
  });

  return availableDisciplines;
}
