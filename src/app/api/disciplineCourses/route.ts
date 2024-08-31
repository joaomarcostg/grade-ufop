import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
 
export async function GET() {
  const disciplineCourses = await prisma.disciplineCourse.findMany()

  return NextResponse.json({ data: disciplineCourses })
}