import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { disciplineId } = await request.json()
    await prisma.completedDiscipline.create({
      data: {
        userId: params.userId,
        disciplineId
      }
    })

    const updatedUser = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        course: { select: { id: true, name: true } },
        completedDisciplines: {
          include: { discipline: true }
        }
      }
    })

    return NextResponse.json({ data: updatedUser })
  } catch (error) {
    console.error('Error adding completed discipline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}