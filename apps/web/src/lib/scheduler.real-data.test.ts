/**
 * Runs the planner on the real dataset written by the pipeline
 * (pipeline/out/ufop-2026-2.json). Skipped when it has not been built.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { Section, Weekday } from "./catalog-types";
import { DEFAULT_PREFERENCES, plan, sectionsConflict } from "./scheduler";

const DATASET = fileURLToPath(new URL("../../../../pipeline/out/ufop-2026-2.json", import.meta.url));

interface RawDataset {
  programs: {
    code: string;
    entries: {
      subject_code: string;
      category: string;
      period: number | null;
      weekly_theory: number | null;
      weekly_practice: number | null;
    }[];
  }[];
  sections: {
    subject_code: string;
    code: string;
    seats: number | null;
    meetings: { day: Weekday; start: string; end: string; kind: string | null }[];
  }[];
}

const minutes = (hhmmss: string) => {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
};

describe.skipIf(!existsSync(DATASET))("planner on real 2026/2 data", () => {
  const data: RawDataset = existsSync(DATASET) ? JSON.parse(readFileSync(DATASET, "utf8")) : { programs: [], sections: [] };
  const sections: Section[] = data.sections.map((s, i) => ({
    id: String(i),
    subjectCode: s.subject_code,
    code: s.code,
    seats: s.seats,
    enrolled: null,
    location: null,
    delivery: null,
    withdrawn: false,
    meetings: s.meetings.map((m) => ({
      day: m.day,
      start: minutes(m.start),
      end: minutes(m.end),
      kind: m.kind as Section["meetings"][number]["kind"],
    })),
    instructors: [],
  }));

  it.each(data.programs.map((p) => [p.code, p] as const))("%s: options never clash", (_, program) => {
    // A first-year-ish plan: the mandatory subjects of periods 1-2, plus 3-4.
    for (const periods of [
      [1, 2],
      [3, 4],
    ]) {
      const picked = program.entries.filter(
        (e) => e.category === "mandatory" && e.period !== null && periods.includes(e.period),
      );
      const subjects = picked.map((e) => e.subject_code);
      const load = Object.fromEntries(
        picked.map((e) => [e.subject_code, (e.weekly_theory ?? 0) + (e.weekly_practice ?? 0)]),
      );
      // Two periods usually pass UFOP's 32 weekly class hours, so this also exercises the limit.
      for (const maxLoad of [null, 32]) {
        const started = performance.now();
        const result = plan({ subjects, sections, locked: {}, preferences: DEFAULT_PREFERENCES, limit: 3, load, maxLoad });
        expect(performance.now() - started).toBeLessThan(1500);
        for (const option of result.options) {
          if (maxLoad) expect(option.load).toBeLessThanOrEqual(maxLoad);
          const chosen = Object.values(option.sections);
          for (let i = 0; i < chosen.length; i++)
            for (let j = i + 1; j < chosen.length; j++) expect(sectionsConflict(chosen[i], chosen[j])).toBe(false);
        }
      }
    }
  });
});
