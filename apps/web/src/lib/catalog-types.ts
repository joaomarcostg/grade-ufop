/**
 * The catalog data a page needs, as plain JSON. Built on the server from the
 * database (src/server/catalog.ts) and handed to client components, which do
 * all the planning in the browser.
 */

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type ClassKind = "theory" | "practice";
export type EntryCategory = "mandatory" | "elective" | "optional" | "activity";

export type Requirement = { type: "subject"; code: string } | { type: "hours"; hours: number };

export type HoursByCategory = Partial<
  Record<"mandatory" | "elective" | "optional" | "facultative" | "activities" | "extension" | "total", number>
>;

export interface ProgramSummary {
  code: string;
  name: string;
  degree: string | null;
  campus: string | null;
}

export interface Track {
  kind: string;
  name: string;
  requiredHours: HoursByCategory;
}

export interface Entry {
  subjectCode: string;
  category: EntryCategory;
  track: string | null;
  period: number | null;
  workloadHours: number | null;
  extensionHours: number | null;
  requirements: Requirement[];
}

export interface SubjectInfo {
  code: string;
  name: string;
  department: string | null;
  syllabus: string | null;
}

export interface Meeting {
  day: Weekday;
  /** Minutes after midnight, institution local time. */
  start: number;
  end: number;
  kind: ClassKind | null;
}

export interface Section {
  id: string;
  subjectCode: string;
  code: string;
  seats: number | null;
  enrolled: number | null;
  location: string | null;
  delivery: string | null;
  withdrawn: boolean;
  meetings: Meeting[];
  instructors: { name: string; kinds: ClassKind[] }[];
}

export interface ProgramBundle {
  institution: { code: string; name: string };
  term: { code: string; syncedAt: string | null };
  program: ProgramSummary & {
    curriculumVersion: string | null;
    requiredHours: HoursByCategory;
    tracks: Track[];
  };
  entries: Entry[];
  subjects: Record<string, SubjectInfo>;
  sections: Section[];
}
