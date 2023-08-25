import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.toString()) {
    const disciplines = await prisma.discipline.findMany();
    return NextResponse.json({ data: disciplines });
  }

  const courseId = searchParams.get('courseId');
  const mandatory = searchParams.has('mandatory') ? true : undefined;

  if (courseId) {
    const disciplines = await prisma.discipline.findMany({
      
      where: {
        discipline_course: {
          some: { course_id: courseId, mandatory },
        },
      },
      include: {
        discipline_course: true
      },
     
    });

    // Sort disciplines by period
    const sortedDisciplines = disciplines.sort((a, b) => {
      const periodA = a.discipline_course[0]?.period || 0; // Assuming the period is at index 0, adjust as needed
      const periodB = b.discipline_course[0]?.period || 0;

      if (periodA === periodB) {
        // If periods are the same, sort by discipline.code
        const codeA = a.code || "";
        const codeB = b.code || "";
        return codeA.localeCompare(codeB);
      }

      return periodA - periodB;
    });


    const filteredDisciplines = sortedDisciplines.map((discipline) => ({
      ...discipline,
      discipline_course: undefined,
    }));

    return NextResponse.json({ data: filteredDisciplines });
  }
}
