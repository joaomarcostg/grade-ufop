import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.toString()) {
    const disciplines = await prisma.discipline.findMany();
    return NextResponse.json({ data: disciplines });
  }

  const disciplineId = searchParams.get("disciplineId") ?? undefined;
  const semester =
    searchParams.get("semester") ?? process.env.NEXT_PUBLIC_CURRENT_SEMESTER;

  const disciplines = await prisma.disciplineClass.findMany({
    where: {
      semester,
      disciplineId,
    },
  });

  return NextResponse.json({ data: disciplines });
}
