import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const courseId = searchParams.get('courseId');

  const disciplineCourses = await prisma.disciplineCourse.findMany({
    where: {
      courseId: courseId ?? undefined,
    },
    include: {
      discipline: true,
    },
  });

  return NextResponse.json({ data: disciplineCourses });
}
