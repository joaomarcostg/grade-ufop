import type { Meeting, Section, Weekday } from "./catalog-types";
import { MAX_BREAK_MINUTES, type Shift, shiftOf } from "./time";

/**
 * Builds conflict-free timetables from the subjects a student wants.
 *
 * A depth-first search picks one section per subject (or leaves the subject
 * out), never placing two meetings at the same time. Options are ranked by how
 * many subjects they fit, then by a cost made of days on campus, idle gaps
 * between classes and full sections, weighted by the student's preferences.
 *
 * To stay fast on real timetables (first-year engineering subjects have up to
 * 14 sections each), the search:
 * - merges sections with identical meetings, which are the same choice;
 * - precomputes which candidate sections clash;
 * - always branches on the open subject with the fewest sections still
 *   possible, and counts subjects that can no longer fit at all;
 * - keeps the best few options and drops branches that cannot beat the worst
 *   of them (days on campus and full sections only grow, so they bound cost).
 */

export interface Preferences {
  shifts: Shift[];
  avoidGaps: boolean;
  fewerDays: boolean;
  onlyWithSeats: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  shifts: ["morning", "afternoon", "night"],
  avoidGaps: true,
  fewerDays: false,
  onlyWithSeats: false,
};

export interface PlanRequest {
  /** Subject codes in the order the student added them. */
  subjects: string[];
  sections: Section[];
  /** Subject code -> section code the student fixed. */
  locked: Record<string, string>;
  preferences: Preferences;
  /** How many options to return. */
  limit?: number;
  /** Search budget, so huge requests still answer quickly. */
  maxNodes?: number;
}

export interface PlanOption {
  /** Subject code -> chosen section. */
  sections: Record<string, Section>;
  /** Requested subjects that did not fit in this option. */
  left: string[];
  days: number;
  gapMinutes: number;
  fullSections: number;
  cost: number;
}

export type UnavailableReason = "not-offered" | "shift" | "seats";

export interface PlanResult {
  options: PlanOption[];
  /** Requested subjects with no section left after the filters. */
  unavailable: { code: string; reason: UnavailableReason }[];
  /** True when the search budget ran out before every branch was explored. */
  truncated: boolean;
}

const DAY_COST = { normal: 60, fewerDays: 240 };
const GAP_COST_PER_MINUTE = { normal: 0.5, avoidGaps: 2 };
const FULL_SECTION_COST = 600;

export function conflicts(a: Meeting, b: Meeting): boolean {
  return a.day === b.day && a.start < b.end && b.start < a.end;
}

export function sectionsConflict(a: Section, b: Section): boolean {
  return a.meetings.some((m) => b.meetings.some((n) => conflicts(m, n)));
}

function isFull(section: Section) {
  return section.seats !== null && section.seats <= 0;
}

/** Sections of ``code`` the student can pick, after locks and filters. */
export function candidateSections(
  code: string,
  sections: Section[],
  locked: Record<string, string>,
  preferences: Preferences,
): { candidates: Section[]; reason: UnavailableReason | null } {
  const offered = sections.filter((s) => s.subjectCode === code && !s.withdrawn);
  if (offered.length === 0) return { candidates: [], reason: "not-offered" };
  if (locked[code]) {
    const fixed = offered.filter((s) => s.code === locked[code]);
    if (fixed.length) return { candidates: fixed, reason: null };
  }
  const inShift = offered.filter((s) => s.meetings.every((m) => preferences.shifts.includes(shiftOf(m.start))));
  if (inShift.length === 0) return { candidates: [], reason: "shift" };
  const withSeats = preferences.onlyWithSeats ? inShift.filter((s) => !isFull(s)) : inShift;
  if (withSeats.length === 0) return { candidates: [], reason: "seats" };
  return { candidates: withSeats, reason: null };
}

export function scheduleStats(sections: Section[]): { days: number; gapMinutes: number; fullSections: number } {
  const byDay = new Map<Weekday, Meeting[]>();
  for (const section of sections) {
    for (const m of section.meetings) byDay.set(m.day, [...(byDay.get(m.day) ?? []), m]);
  }
  let gapMinutes = 0;
  for (const meetings of byDay.values()) {
    meetings.sort((a, b) => a.start - b.start);
    for (let i = 1; i < meetings.length; i++) {
      const gap = meetings[i].start - meetings[i - 1].end;
      if (gap > MAX_BREAK_MINUTES) gapMinutes += gap;
    }
  }
  return { days: byDay.size, gapMinutes, fullSections: sections.filter(isFull).length };
}

function cost(stats: ReturnType<typeof scheduleStats>, preferences: Preferences) {
  const dayCost = preferences.fewerDays ? DAY_COST.fewerDays : DAY_COST.normal;
  const gapCost = preferences.avoidGaps ? GAP_COST_PER_MINUTE.avoidGaps : GAP_COST_PER_MINUTE.normal;
  return stats.days * dayCost + stats.gapMinutes * gapCost + stats.fullSections * FULL_SECTION_COST;
}

/** Better first: more subjects, then lower cost, then a stable tie-break. */
function compare(a: PlanOption, b: PlanOption) {
  const fitted = Object.keys(b.sections).length - Object.keys(a.sections).length;
  return fitted || a.cost - b.cost || key(a).localeCompare(key(b));
}

function key(option: PlanOption) {
  return Object.keys(option.sections)
    .sort()
    .map((code) => `${code}:${option.sections[code].code}`)
    .join("|");
}

export function plan(request: PlanRequest): PlanResult {
  const limit = request.limit ?? 3;
  const maxNodes = request.maxNodes ?? 200_000;
  const unavailable: PlanResult["unavailable"] = [];
  const subjects: { code: string; candidates: Section[] }[] = [];

  for (const code of request.subjects) {
    const { candidates, reason } = candidateSections(code, request.sections, request.locked, request.preferences);
    if (reason) unavailable.push({ code, reason });
    else subjects.push({ code, candidates: interchangeable(candidates) });
  }

  // Every candidate section, with the candidates it clashes with precomputed.
  const all: { subject: number; section: Section; full: boolean; days: number }[] = [];
  const bySubject: number[][] = subjects.map(() => []);
  subjects.forEach((s, subject) =>
    s.candidates.forEach((section) => {
      bySubject[subject].push(all.length);
      all.push({ subject, section, full: isFull(section), days: dayMask(section) });
    }),
  );
  const clashes: number[][] = all.map(() => []);
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (all[i].subject !== all[j].subject && sectionsConflict(all[i].section, all[j].section)) {
        clashes[i].push(j);
        clashes[j].push(i);
      }
    }
  }

  const dayCost = request.preferences.fewerDays ? DAY_COST.fewerDays : DAY_COST.normal;
  // blocked[c] > 0: candidate c clashes with something already chosen.
  const blocked = new Int32Array(all.length);
  // assigned[s]: chosen candidate index, -1 left out, undefined still open.
  const assigned: (number | undefined)[] = new Array(subjects.length);
  let fitted = 0;
  let days = 0;
  let fullCount = 0;

  const best: PlanOption[] = [];
  const seen = new Set<string>();
  let nodes = 0;
  let truncated = false;

  const worstKept = () => (best.length < limit ? null : best[best.length - 1]);

  const record = () => {
    if (fitted === 0) return;
    const sections: Record<string, Section> = {};
    assigned.forEach((c, subject) => {
      if (c !== undefined && c >= 0) sections[subjects[subject].code] = all[c].section;
    });
    const stats = scheduleStats(Object.values(sections));
    const option: PlanOption = {
      sections,
      left: subjects.map((s) => s.code).filter((code) => !(code in sections)),
      ...stats,
      cost: cost(stats, request.preferences),
    };
    const id = key(option);
    const worst = worstKept();
    if (seen.has(id) || (worst && compare(option, worst) >= 0)) return;
    seen.add(id);
    best.push(option);
    best.sort(compare);
    if (best.length > limit) seen.delete(key(best.pop()!));
  };

  const choose = (c: number, delta: 1 | -1) => {
    for (const other of clashes[c]) blocked[other] += delta;
  };

  const search = () => {
    if (++nodes > maxNodes) {
      truncated = true;
      return;
    }
    // Most constrained open subject first; count the ones that can still fit.
    let next = -1;
    let nextOpen = Infinity;
    let canFit = 0;
    for (let subject = 0; subject < subjects.length; subject++) {
      if (assigned[subject] !== undefined) continue;
      let open = 0;
      for (const c of bySubject[subject]) if (blocked[c] === 0) open++;
      if (open > 0) canFit++;
      if (open < nextOpen) {
        next = subject;
        nextOpen = open;
      }
    }
    if (next === -1) {
      record();
      return;
    }

    const worst = worstKept();
    if (worst) {
      const worstFitted = Object.keys(worst.sections).length;
      if (fitted + canFit < worstFitted) return;
      // Days on campus and full sections only grow, so this is a lower bound.
      const floor = popcount(days) * dayCost + fullCount * FULL_SECTION_COST;
      if (fitted + canFit === worstFitted && floor >= worst.cost) return;
    }

    // Try sections that add no new day (and have seats) first: good options early prune more.
    const options = bySubject[next]
      .filter((c) => blocked[c] === 0)
      .sort((a, b) => popcount(all[a].days & ~days) - popcount(all[b].days & ~days) || +all[a].full - +all[b].full);
    for (const c of options) {
      const previousDays = days;
      assigned[next] = c;
      fitted++;
      days |= all[c].days;
      if (all[c].full) fullCount++;
      choose(c, 1);
      search();
      choose(c, -1);
      if (all[c].full) fullCount--;
      days = previousDays;
      fitted--;
      assigned[next] = undefined;
      if (truncated) return;
    }
    assigned[next] = -1; // leave this subject out
    search();
    assigned[next] = undefined;
  };

  search();
  return { options: best, unavailable, truncated };
}

/** Sections with the same meetings (and seat status) are the same choice for the timetable. */
function interchangeable(sections: Section[]): Section[] {
  const byTimes = new Map<string, Section>();
  const ordered = [...sections].sort((a, b) => (b.seats ?? Infinity) - (a.seats ?? Infinity) || a.code.localeCompare(b.code));
  for (const section of ordered) {
    const times = section.meetings
      .map((m) => `${m.day}${m.start}-${m.end}`)
      .sort()
      .join(",");
    const id = `${times}|${isFull(section) ? "full" : "open"}`;
    if (!byTimes.has(id)) byTimes.set(id, section);
  }
  return [...byTimes.values()];
}

const DAY_BITS: Record<Weekday, number> = { MON: 1, TUE: 2, WED: 4, THU: 8, FRI: 16, SAT: 32, SUN: 64 };

function dayMask(section: Section) {
  return section.meetings.reduce((mask, m) => mask | DAY_BITS[m.day], 0);
}

function popcount(mask: number) {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count++;
  return count;
}
