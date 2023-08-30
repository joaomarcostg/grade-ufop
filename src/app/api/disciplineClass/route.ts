import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.toString()) {
    const disciplines = await prisma.discipline.findMany();
    return NextResponse.json({ data: disciplines });
  }

  const disciplineClassId = searchParams.get("disciplineClassId");

  if (disciplineClassId) {
    const disciplines = await prisma.discipline_class_schedule.findMany({
      where: {
        discipline_class_id: disciplineClassId,
      },
      include: {
        discipline_class: true,
      },
    });

    return NextResponse.json({ data: disciplines });
  }
}
