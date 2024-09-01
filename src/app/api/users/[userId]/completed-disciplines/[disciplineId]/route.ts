import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: { userId: string; disciplineId: string } }
) {
  try {
    await prisma.completedDiscipline.delete({
      where: {
        userId_disciplineId: {
          userId: params.userId,
          disciplineId: params.disciplineId
        }
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
    console.error('Error removing completed discipline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
