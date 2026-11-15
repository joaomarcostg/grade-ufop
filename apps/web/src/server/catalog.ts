import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type {
  HoursByCategory,
  ProgramBundle,
  ProgramSummary,
  Requirement,
  SubjectInfo,
} from "@/lib/catalog-types";

import { prisma } from "./db";

/**
 * Catalog reads. The catalog only changes when the pipeline loads a new
 * dataset, so results are cached for hours and tagged per institution; a
 * sync can revalidate the tag to refresh them at once.
 */

export function catalogTag(institution: string) {
  return `catalog:${institution}`;
}

export async function listPrograms(institution: string): Promise<ProgramSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTag(institution));

  const programs = await prisma.program.findMany({
    where: { institution: { code: institution } },
    select: { code: true, name: true, displayName: true, degree: true, campus: true },
  });
  return programs
    .map((p) => ({
      code: p.code,
      name: p.displayName ?? p.name,
      degree: titleCase(p.degree),
      campus: titleCase(p.campus),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.code.localeCompare(b.code));
}

export interface Coverage {
  term: string;
  syncedAt: string | null;
  programs: number;
  departments: number;
  sections: number;
}

export async function getCoverage(institution: string): Promise<Coverage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTag(institution));

  const term = await prisma.term.findFirst({
    where: { institution: { code: institution }, isCurrent: true },
  });
  if (!term) return null;
  const [programs, departments, sections] = await Promise.all([
    prisma.curriculum.count({ where: { termId: term.id } }),
    prisma.department.count({ where: { institutionId: term.institutionId } }),
    prisma.section.count({ where: { termId: term.id, withdrawnAt: null } }),
  ]);
  return { term: term.code, syncedAt: term.syncedAt?.toISOString() ?? null, programs, departments, sections };
}

export async function getProgramBundle(
  institutionCode: string,
  programCode: string,
): Promise<ProgramBundle | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTag(institutionCode));

  const institution = await prisma.institution.findUnique({ where: { code: institutionCode } });
  if (!institution) return null;
  const term = await prisma.term.findFirst({
    where: { institutionId: institution.id, isCurrent: true },
  });
  if (!term) return null;

  const program = await prisma.program.findUnique({
    where: { institutionId_code: { institutionId: institution.id, code: programCode.toUpperCase() } },
  });
  if (!program) return null;

  const curriculum = await prisma.curriculum.findUnique({
    where: { programId_termId: { programId: program.id, termId: term.id } },
    include: {
      tracks: true,
      entries: {
        include: {
          subject: { select: { code: true } },
          requirements: { include: { subject: { select: { code: true } } } },
        },
      },
    },
  });
  if (!curriculum) return null;

  const entries = curriculum.entries.map((e) => ({
    subjectCode: e.subject.code,
    category: e.category,
    track: e.track,
    period: e.period,
    workloadHours: e.workloadHours,
    extensionHours: e.extensionHours,
    weeklyClasses: (e.weeklyTheory ?? 0) + (e.weeklyPractice ?? 0) || null,
    requirements: e.requirements.map(
      (r): Requirement =>
        r.subject ? { type: "subject", code: r.subject.code } : { type: "hours", hours: r.hours ?? 0 },
    ),
  }));

  const codes = new Set<string>();
  for (const entry of entries) {
    codes.add(entry.subjectCode);
    for (const r of entry.requirements) if (r.type === "subject") codes.add(r.code);
  }

  const subjectRows = await prisma.subject.findMany({
    where: { institutionId: institution.id, code: { in: [...codes] } },
    select: {
      id: true,
      code: true,
      name: true,
      displayName: true,
      syllabus: true,
      department: { select: { code: true } },
    },
  });
  const subjects: Record<string, SubjectInfo> = {};
  for (const s of subjectRows) {
    subjects[s.code] = {
      code: s.code,
      name: s.displayName ?? s.name,
      department: s.department?.code ?? null,
      syllabus: s.syllabus,
    };
  }

  const offered = new Set(entries.map((e) => e.subjectCode));
  const sectionRows = await prisma.section.findMany({
    where: {
      termId: term.id,
      subjectId: { in: subjectRows.filter((s) => offered.has(s.code)).map((s) => s.id) },
    },
    include: {
      subject: { select: { code: true } },
      meetings: true,
      instructors: { orderBy: { position: "asc" } },
    },
    orderBy: [{ subject: { code: "asc" } }, { code: "asc" }],
  });

  return {
    institution: { code: institution.code, name: institution.name },
    term: { code: term.code, syncedAt: term.syncedAt?.toISOString() ?? null },
    program: {
      code: program.code,
      name: program.displayName ?? program.name,
      degree: titleCase(program.degree),
      campus: titleCase(program.campus),
      curriculumVersion: curriculum.version,
      requiredHours: curriculum.requiredHours as HoursByCategory,
      tracks: curriculum.tracks.map((t) => ({
        kind: t.kind,
        name: titleCase(t.name) ?? t.name,
        requiredHours: t.requiredHours as HoursByCategory,
      })),
    },
    entries: entries.map((e) => ({ ...e, track: e.track ? (titleCase(e.track) ?? e.track) : null })),
    subjects,
    sections: sectionRows.map((s) => ({
      id: s.id,
      subjectCode: s.subject.code,
      code: s.code,
      seats: s.seats,
      enrolled: s.enrolled,
      location: titleCase(s.location),
      delivery: s.delivery,
      withdrawn: s.withdrawnAt !== null,
      meetings: s.meetings
        .map((m) => ({ day: m.day, start: m.startMinute, end: m.endMinute, kind: m.kind }))
        .sort((a, b) => dayIndex(a.day) - dayIndex(b.day) || a.start - b.start),
      instructors: s.instructors.map((i) => ({ name: titleCase(i.name) ?? i.name, kinds: i.kinds })),
    })),
  };
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function dayIndex(day: string) {
  return DAYS.indexOf(day);
}

const LOWER = new Set(["de", "da", "do", "das", "dos", "e"]);

/** "JOAO MONLEVADE" -> "Joao Monlevade". For short labels the pipeline does not rename. */
function titleCase(value: string | null): string | null {
  if (!value) return value;
  return value
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && LOWER.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
