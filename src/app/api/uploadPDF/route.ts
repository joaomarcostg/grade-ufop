import { NextRequest, NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import type { TextContent, TextItem } from "pdfjs-dist/types/src/display/api";
import prisma from "@/lib/prisma";

async function getPDFContent(file: File) {
  await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

  const fileBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(fileBuffer);

  const pdf = await pdfjsLib.getDocument({
    data: buffer,
    cMapPacked: true,
    standardFontDataUrl: "public/fonts/",
  }).promise;

  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();

  return textContent;
}

function retrievePendingDisciplines(textContent: TextContent) {
  const disciplines: string[] = [];

  for (const item of textContent.items as Array<TextItem>) {
    const disciplinesFound = item.str.match(/\b[A-Z]{3}\d{3}\b(?!\()/g);
    if (disciplinesFound?.length) {
      disciplines.push(...disciplinesFound);
    }
  }

  return disciplines;
}

async function findAlreadyCoursedDisciplines(file: File, courseId: string) {
  const textContent = await getPDFContent(file);
  const pendingCodes = retrievePendingDisciplines(textContent);

  const pending = await prisma.disciplineCourse.findMany({
    where: {
      courseId: courseId,
      AND: {
        discipline: {
          code: {
            in: pendingCodes,
          },
        },
      },
    },
    select: {
      discipline: true,
    },
  });

  const equivalencyGroups = pending
    .map((pd) => pd.discipline.equivalencyGroupId)
    .filter((val) => val !== null);

  const equivalentDisciplines = await prisma.discipline.findMany({
    where: {
      equivalencyGroupId: {
        in: equivalencyGroups,
      },
    },
  });

  const pendingDisciplineIds = [
    ...pending.map((d) => d.discipline.id),
    ...equivalentDisciplines.map((d) => d.id),
  ];

  const pendingDisciplines = Array.from(new Set(pendingDisciplineIds));

  const alreadyCoursedDisciplines = await prisma.disciplineCourse.findMany({
    where: {
      courseId: courseId,
      mandatory: true,
      AND: {
        discipline: {
          id: {
            notIn: pendingDisciplines,
          },
        },
      },
    },
    select: {
      discipline: true,
    },
  });

  return alreadyCoursedDisciplines;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  if (!formData) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const courseId = formData.get("courseId") as string;
  const file = formData.get("file") as File;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Uploaded file is not a PDF" },
      { status: 400 }
    );
  }

  if (!courseId) {
    return NextResponse.json(
      { error: "Course ID not provided" },
      { status: 400 }
    );
  }

  try {
    const alreadyCoursedDisciplines = await findAlreadyCoursedDisciplines(
      file,
      courseId
    );

    return NextResponse.json({
      data: alreadyCoursedDisciplines.map(d => d.discipline),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
