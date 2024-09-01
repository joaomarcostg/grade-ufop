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


[
  {"CEA562": "ELT562"},
  {"CSI509": "CSI210"},
  {"CSI546": "CSI115"},
  {"CEA561": "ELT561"},
  {"CEA582": "ELT582"},
  {"CSI476": "CSI106"},
  {"CEA551": "ELT551"},
  {"CEA580": "ELT580"},
  {"CSI419": "CSI114"},
  {"CSI450": "CSI522"},
  {"CSI506": "CSI109"},
  {"CSI510": "CSI302"},
  {"CSI433": "CSI302"},
  {"CSI495": "CSI995"},
  {"CSI693": "CSI206"},
  {"CSI496": "CSI996"},
  {"CEA552": "ELT552"},
  {"CSI148": "CSI012"},
  {"CSI503": "CSI406"},
  {"CSI508": "CSI706"}
  ]


async function findAlreadyCoursedDisciplines(file: File, courseId: string) {
  const textContent = await getPDFContent(file);
  const oldPending = retrievePendingDisciplines(textContent);
  
  // Define the mapping
  const disciplineMapping = [
    {"CEA562": "ELT562"},
    {"CSI509": "CSI210"},
    {"CSI546": "CSI115"},
    {"CEA561": "ELT561"},
    {"CEA582": "ELT582"},
    {"CSI476": "CSI106"},
    {"CEA551": "ELT551"},
    {"CEA580": "ELT580"},
    {"CSI419": "CSI114"},
    {"CSI450": "CSI522"},
    {"CSI506": "CSI109"},
    {"CSI510": "CSI302"},
    {"CSI433": "CSI302"},
    {"CSI495": "CSI995"},
    {"CSI693": "CSI206"},
    {"CSI496": "CSI996"},
    {"CEA552": "ELT552"},
    {"CSI148": "CSI012"},
    {"CSI503": "CSI406"},
    {"CSI508": "CSI706"}
  ];

  // Convert old pending disciplines to new ones
  const pending = oldPending.map(oldCode => {
    const mappingObject = disciplineMapping.find(mapping => Object.keys(mapping)[0] === oldCode);
    return mappingObject ? Object.values(mappingObject)[0] : oldCode;
  });

  const alreadyCoursedDisciplines = await prisma.disciplineCourse.findMany({
    where: {
      courseId: courseId,
      AND: {
        discipline: {
          code: {
            notIn: pending,
          },
        },
      },
    },
  });

  console.log({alreadyCoursedDisciplines});

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
    return NextResponse.json({ error: "Uploaded file is not a PDF" }, { status: 400 });
  }

  if (!courseId) {
    return NextResponse.json({ error: "Course ID not provided" }, { status: 400 });
  }

  try {
    const alreadyCoursedDisciplines = await findAlreadyCoursedDisciplines(file, courseId);

    return NextResponse.json({
      data: alreadyCoursedDisciplines,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}
