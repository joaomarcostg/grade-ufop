import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { courseId } = await req.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { courseId: courseId },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user course:', error);
    return NextResponse.json({ error: 'Failed to update user course' }, { status: 500 });
  }
}