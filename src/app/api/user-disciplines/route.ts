import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { config } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(config);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { disciplineIds } = await request.json();

  if (!Array.isArray(disciplineIds)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const completedDisciplines = await Promise.all(
      disciplineIds.map((disciplineId) =>
        prisma.userCompletedDiscipline.create({
          data: {
            userId: user.id,
            disciplineId,
            completedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({ success: true, completedDisciplines });
  } catch (error) {
    console.error('Error saving user disciplines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}