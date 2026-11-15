import type { Entry, EntryCategory, HoursByCategory, ProgramBundle, Requirement } from "./catalog-types";

/**
 * What a student can take, given the subjects they passed.
 *
 * UFOP lists prerequisites as a conjunction: every subject requirement must be
 * passed and the completed workload must reach every hour requirement. The
 * completed workload counts the passed entries of the student's own
 * curriculum.
 */

export type EntryStatus = "done" | "available" | "locked";

export interface EntryState {
  entry: Entry;
  status: EntryStatus;
  /** Requirements still missing (empty unless locked). */
  missing: Requirement[];
  /** Has at least one section offered this term. */
  offered: boolean;
  /** Sections offered this term that still have seats (null seats count as open). */
  openSections: number;
  /** Pending mandatory entries that list this subject as a prerequisite. */
  unlocks: string[];
}

export interface Progress {
  completedHours: number;
  byCategory: Record<EntryCategory, number>;
  required: HoursByCategory;
}

export interface Eligibility {
  states: Map<string, EntryState>;
  progress: Progress;
}

/** Entries that apply to a student in ``track`` (null: no track chosen, show all). */
export function entriesForTrack(entries: Entry[], track: string | null): Entry[] {
  if (!track) return entries;
  return entries.filter((e) => e.track === null || e.track === track);
}

export function computeEligibility(
  bundle: ProgramBundle,
  completed: ReadonlySet<string>,
  track: string | null,
): Eligibility {
  const entries = entriesForTrack(bundle.entries, track);

  const byCategory: Record<EntryCategory, number> = {
    mandatory: 0,
    elective: 0,
    optional: 0,
    activity: 0,
  };
  for (const entry of entries) {
    if (completed.has(entry.subjectCode)) byCategory[entry.category] += entry.workloadHours ?? 0;
  }
  const completedHours = Object.values(byCategory).reduce((a, b) => a + b, 0);

  const sectionsBySubject = new Map<string, { total: number; open: number }>();
  for (const section of bundle.sections) {
    if (section.withdrawn) continue;
    const counts = sectionsBySubject.get(section.subjectCode) ?? { total: 0, open: 0 };
    counts.total += 1;
    if (section.seats === null || section.seats > 0) counts.open += 1;
    sectionsBySubject.set(section.subjectCode, counts);
  }

  const unlocks = new Map<string, string[]>();
  for (const entry of entries) {
    if (entry.category !== "mandatory" || completed.has(entry.subjectCode)) continue;
    for (const r of entry.requirements) {
      if (r.type !== "subject") continue;
      unlocks.set(r.code, [...(unlocks.get(r.code) ?? []), entry.subjectCode]);
    }
  }

  const states = new Map<string, EntryState>();
  for (const entry of entries) {
    const done = completed.has(entry.subjectCode);
    const missing = done
      ? []
      : entry.requirements.filter((r) =>
          r.type === "subject" ? !completed.has(r.code) : completedHours < r.hours,
        );
    const counts = sectionsBySubject.get(entry.subjectCode);
    states.set(entry.subjectCode, {
      entry,
      status: done ? "done" : missing.length ? "locked" : "available",
      missing,
      offered: (counts?.total ?? 0) > 0,
      openSections: counts?.open ?? 0,
      unlocks: unlocks.get(entry.subjectCode) ?? [],
    });
  }

  return {
    states,
    progress: { completedHours, byCategory, required: requiredHours(bundle, track, entries) },
  };
}

/**
 * Hours needed to graduate. With a track, its own totals; when a track name
 * appears as both a habilitação and an ênfase, the one whose mandatory total
 * matches the track's rows.
 */
export function requiredHours(bundle: ProgramBundle, track: string | null, entries?: Entry[]): HoursByCategory {
  const candidates = bundle.program.tracks.filter((t) => t.name === track);
  if (!track || candidates.length === 0) return bundle.program.requiredHours;
  const rows = entries ?? entriesForTrack(bundle.entries, track);
  const mandatory = rows
    .filter((e) => e.category === "mandatory")
    .reduce((sum, e) => sum + (e.workloadHours ?? 0), 0);
  const match = candidates.find((t) => t.requiredHours.mandatory === mandatory) ?? candidates[0];
  return { ...bundle.program.requiredHours, ...match.requiredHours };
}

/** Pending mandatory subjects the student can take now, most unlocking first. */
export function mostUnlocking(eligibility: Eligibility, limit = 4): EntryState[] {
  return [...eligibility.states.values()]
    .filter((s) => s.status === "available" && s.entry.category === "mandatory" && s.unlocks.length > 0)
    .sort(
      (a, b) =>
        b.unlocks.length - a.unlocks.length ||
        (a.entry.period ?? 99) - (b.entry.period ?? 99) ||
        a.entry.subjectCode.localeCompare(b.entry.subjectCode),
    )
    .slice(0, limit);
}

/** Short label for what is missing: "falta 1", "faltam 2" or "1.800 h". */
export function missingLabel(state: EntryState): string {
  const subjects = state.missing.filter((r) => r.type === "subject").length;
  const hours = state.missing.find((r) => r.type === "hours");
  if (subjects === 0 && hours) return `${hours.hours.toLocaleString("pt-BR")} h`;
  return subjects === 1 ? "falta 1" : `faltam ${subjects}`;
}
