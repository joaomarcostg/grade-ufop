import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

    if (!searchParams.toString()) {
    const disciplines = await prisma.discipline.findMany()
    return NextResponse.json({ data: disciplines })
  }

  const courseId = searchParams.get('courseId')
  const mandatory = searchParams.has('mandatory') ? true : undefined

  if (courseId) {
    const disciplines = await prisma.discipline.findMany({
      where: {
        discipline_course: {
          some: { course_id: courseId, mandatory },
        },
      },
    })

    const filteredDisciplines = disciplines.map((discipline) => ({
      ...discipline,
      discipline_course: undefined,
    }))

    return NextResponse.json({ data: filteredDisciplines })
  }
  
}