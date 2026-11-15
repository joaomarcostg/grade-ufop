import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const courseId = searchParams.get("courseId");
  const period = searchParams.get("period");
  const mandatory = searchParams.has("mandatory") ? true : undefined;

  const disciplineCourses = await prisma.disciplineCourse.findMany({
    where: {
      courseId: courseId ?? undefined,
      period: period ? parseInt(period) : undefined,
      mandatory,
    },
    include: {
      discipline: true,
    },
  });

  const processedEquivalencyGroups = new Set<string>();
  const formattedDisciplineCourses = disciplineCourses
    .filter((disciplineCourse) => {
      const equivalencyGroupId = disciplineCourse.discipline.equivalencyGroupId;

      // If there's no equivalency group, always include the discipline
      if (!equivalencyGroupId) return true;

      // If we've already processed this equivalency group, exclude the discipline
      if (processedEquivalencyGroups.has(equivalencyGroupId)) return false;

      // Otherwise, mark this equivalency group as processed and include the discipline
      processedEquivalencyGroups.add(equivalencyGroupId);
      return true;
    })
    .map((disciplineCourse) => ({
      id: disciplineCourse.discipline.id,
      code: disciplineCourse.discipline.code,
      name: disciplineCourse.discipline.name,
      period: disciplineCourse.period,
      mandatory: disciplineCourse.mandatory,
    }));

  return NextResponse.json({ data: formattedDisciplineCourses });
}
