import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

type RequestBody = {
  courseId: string;
  coursedDisciplines: string[];
};

export async function POST(request: NextRequest) {
  const body: RequestBody = await request.json();
  const disciplineCourses = await getAvailableDisciplines(body);

  return NextResponse.json({ data: disciplineCourses });
}

async function getPrerequisitesByDisciplineCourseId(
  disciplineCourseId: string
) {
  const prerequisites = await prisma.prerequisite.findMany({
    where: {
      disciplineCourseId,
    },
    include: {
      prerequisiteDiscipline: true, // Including the prerequisite discipline details
    },
  });

  return prerequisites.map((prerequisite) => ({
    id: prerequisite.id,
    discipline_id: prerequisite.disciplineCourseId,
    discipline: prerequisite.prerequisiteDiscipline, // Contains the details of the prerequisite discipline
  }));
}

async function getDisciplineCourseId(courseId: string, disciplineId: string) {
  const disciplineCourse = await prisma.disciplineCourse.findFirst({
    where: {
      courseId,
      disciplineId,
    },
  });

  return disciplineCourse?.id; // Returns the discipline_course_id or undefined if not found
}

async function getDisciplinesForCourse(courseId: string) {
  const disciplines = await prisma.discipline.findMany({
    where: {
      courses: {
        some: {
          courseId,
        },
      },
    },
    include: {
      classes: {
        select: {
          id: true,
          classNumber: true,
          professor: true,
        },
      }, // Include the classes for each discipline
      courses: {
        where: {
         courseId,
        },
        select: {
          period: true,
        },
      },
    },
  });

  return disciplines;
}

async function getAvailableDisciplines({
  courseId,
  coursedDisciplines,
}: RequestBody) {
  const availableDisciplines = [];
  const disciplinesFromCourse = await getDisciplinesForCourse(courseId);

  for (const discipline of disciplinesFromCourse) {
    const isCoursed = coursedDisciplines.includes(discipline.id);

    if (isCoursed) {
      continue;
    }

    const disciplineCourseId = await getDisciplineCourseId(
      courseId,
      discipline.id
    );

    if (!disciplineCourseId) {
      continue;
    }

    const prerequisites = await getPrerequisitesByDisciplineCourseId(
      disciplineCourseId
    );

    // Check if prerequisites are met
    const prerequisitesMet = prerequisites.every((prerequisite) =>
      coursedDisciplines.includes(prerequisite.discipline_id ?? "")
    );

    // If not coursed and prerequisites are met, we can list it as an option
    // If prerequisites are not met, we can list it but disable the selection
    if (!isCoursed && prerequisitesMet) {
      availableDisciplines.push({
        id: discipline.id,
        code: discipline.code,
        name: discipline.name,
        isEnabled: true,
        period: discipline.courses[0]?.period,
        classes: discipline.classes, // Include the classes in the response
      });
    }
  }

  // Sort disciplines by period and then by code
  availableDisciplines.sort((a, b) => {
    const periodA = a.period || 0;
    const periodB = b.period || 0;

    if (periodA === 0) return 1; // Move disciplines with periodA == 0 to the end
    if (periodB === 0) return -1; // Move disciplines with periodB == 0 to the end

    if (periodA === periodB) {
      const codeA = a.code || "";
      const codeB = b.code || "";
      return codeA.localeCompare(codeB);
    }

    return periodA - periodB;
  });

  return availableDisciplines;
}
