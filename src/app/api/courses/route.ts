import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// export const revalidate = 3600;

export async function GET() {
  const courses = await prisma.course.findMany();

  return NextResponse.json({ data: courses });
}
