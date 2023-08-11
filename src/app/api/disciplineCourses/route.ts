import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
 
export async function GET() {
  const disciplineCourses = await prisma.discipline_course.findMany()

  return NextResponse.json({ data: disciplineCourses })
}