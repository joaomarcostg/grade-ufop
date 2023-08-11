import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const courses = await prisma.course.findMany()

  return NextResponse.json({ data: courses })

}