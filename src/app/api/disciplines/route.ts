import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.toString()) {
    const disciplines = await prisma.discipline.findMany();
    return NextResponse.json({ data: disciplines });
  }

  const courseId = searchParams.get("courseId");
  const semester = searchParams.get("semester") ?? process.env.NEXT_PUBLIC_CURRENT_SEMESTER;
  const period = searchParams.get("period");
  const mandatory = searchParams.has("mandatory") ? true : undefined;

  if (courseId) {
    const disciplines = await prisma.discipline.findMany({
      where: {
        courses: {
          some: { 
            courseId: courseId,
            mandatory,
            period: period ? parseInt(period) : undefined
          },
        },
        classes: {
          some: {
            semester,
          },
        },
      },
      include: {
        courses: {
          where: { courseId: courseId },
          select: { period: true, mandatory: true }
        },
      },
    });

    const filteredDisciplines = disciplines.map(discipline => ({
      id: discipline.id,
      code: discipline.code,
      name: discipline.name,
      period: discipline.courses[0]?.period ?? null,
      mandatory: discipline.courses[0]?.mandatory ?? false,
    }));

    // Sort disciplines by period and then by code
    const sortedDisciplines = filteredDisciplines.sort((a, b) => {
      const periodA = a.period || 0;
      const periodB = b.period || 0;

      if (periodA === periodB) {
        return (a.code || "").localeCompare(b.code || "");
      }

      return periodA - periodB;
    });

    return NextResponse.json({ data: sortedDisciplines });
  }

  return NextResponse.json({ data: [] });
}