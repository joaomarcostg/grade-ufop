import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        course: { select: { id: true, name: true } },
        completedDisciplines: {
          include: { discipline: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Error fetching user course and disciplines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}