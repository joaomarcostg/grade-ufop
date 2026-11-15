import { describe, expect, it } from "vitest";

import type { Meeting, Section, Weekday } from "./catalog-types";
import { DEFAULT_PREFERENCES, type Preferences, plan, scheduleStats, sectionsConflict } from "./scheduler";

const t = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function section(subjectCode: string, code: string, slots: string[], seats: number | null = 10): Section {
  const meetings: Meeting[] = slots.map((slot) => {
    const [day, range] = slot.split(" ");
    const [start, end] = range.split("-");
    return { day: day as Weekday, start: t(start), end: t(end), kind: "theory" };
  });
  return {
    id: `${subjectCode}-${code}`,
    subjectCode,
    code,
    seats,
    enrolled: 0,
    location: null,
    delivery: null,
    withdrawn: false,
    meetings,
    instructors: [],
  };
}

// Real 2026/2 sections from UFOP's timetable (Sistemas de Informação).
const SJM = [
  section("CSI204", "11", ["MON 19:00-20:40", "WED 21:00-22:40"], 2),
  section("CSI412", "21", ["TUE 21:00-22:40", "FRI 19:00-20:40"], 0),
  section("CSI412", "22", ["MON 19:00-20:40", "WED 19:00-20:40"], 20),
  section("CSI602", "21", ["MON 21:00-22:40", "THU 19:00-20:40"], 1),
  section("CSI602", "22", ["WED 15:20-17:00", "FRI 15:20-17:00"], 24),
  section("CSI301", "21", ["TUE 13:30-15:10", "THU 15:20-16:10", "THU 16:10-17:00"], 34),
  section("CSI701", "11", ["TUE 15:20-17:00", "FRI 13:30-15:10"], 23),
  section("CSI106", "11", ["MON 13:30-15:10", "THU 13:30-15:10"], 19),
  section("ENP026", "11", ["WED 13:30-15:10", "FRI 15:20-17:00"], 27),
];

const prefs = (overrides: Partial<Preferences> = {}): Preferences => ({ ...DEFAULT_PREFERENCES, ...overrides });

function noConflicts(sections: Section[]) {
  for (let i = 0; i < sections.length; i++)
    for (let j = i + 1; j < sections.length; j++) expect(sectionsConflict(sections[i], sections[j])).toBe(false);
}

describe("plan", () => {
  it("never returns clashing sections", () => {
    const result = plan({
      subjects: ["CSI204", "CSI412", "CSI602", "CSI301", "CSI701", "CSI106", "ENP026"],
      sections: SJM,
      locked: {},
      preferences: prefs(),
      limit: 5,
    });
    expect(result.options.length).toBeGreaterThan(0);
    for (const option of result.options) noConflicts(Object.values(option.sections));
  });

  it("avoids the CSI204 x CSI412 turma 22 clash by using turma 21", () => {
    const result = plan({ subjects: ["CSI204", "CSI412"], sections: SJM, locked: {}, preferences: prefs() });
    const best = result.options[0];
    expect(Object.keys(best.sections).sort()).toEqual(["CSI204", "CSI412"]);
    expect(best.sections.CSI412.code).toBe("21");
    expect(best.fullSections).toBe(1);
  });

  it("drops a subject when only full sections fit and seats are required", () => {
    const result = plan({
      subjects: ["CSI204", "CSI412"],
      sections: SJM,
      locked: {},
      preferences: prefs({ onlyWithSeats: true }),
    });
    expect(result.options[0].left).toEqual(["CSI412"]);
  });

  it("filters by shift and reports subjects with nothing left", () => {
    const result = plan({
      subjects: ["CSI106", "CSI204"],
      sections: SJM,
      locked: {},
      preferences: prefs({ shifts: ["night"] }),
    });
    expect(result.unavailable).toEqual([{ code: "CSI106", reason: "shift" }]);
    expect(Object.keys(result.options[0].sections)).toEqual(["CSI204"]);
  });

  it("honours a locked section even outside the chosen shifts", () => {
    const result = plan({
      subjects: ["CSI602"],
      sections: SJM,
      locked: { CSI602: "22" },
      preferences: prefs({ shifts: ["night"] }),
    });
    expect(result.options[0].sections.CSI602.code).toBe("22");
  });

  it("prefers fewer days when asked", () => {
    const sections = [
      section("A", "1", ["MON 08:00-10:00"]),
      section("A", "2", ["TUE 08:00-10:00"]),
      section("B", "1", ["MON 10:00-12:00"]),
    ];
    const result = plan({ subjects: ["A", "B"], sections, locked: {}, preferences: prefs({ fewerDays: true }) });
    expect(result.options[0].sections.A.code).toBe("1");
    expect(result.options[0].days).toBe(1);
  });

  it("reports subjects that are not offered", () => {
    const result = plan({ subjects: ["CSI808"], sections: SJM, locked: {}, preferences: prefs() });
    expect(result.unavailable).toEqual([{ code: "CSI808", reason: "not-offered" }]);
    expect(result.options).toEqual([]);
  });

  it("stops at the search budget", () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => section(`S${i}`, `${j}`, [`MON ${7 + j}:00-${7 + j}:50`])),
    ).flat();
    const result = plan({
      subjects: Array.from({ length: 14 }, (_, i) => `S${i}`),
      sections: many,
      locked: {},
      preferences: prefs(),
      maxNodes: 1000,
    });
    expect(result.truncated).toBe(true);
    for (const option of result.options) noConflicts(Object.values(option.sections));
  });
});

describe("scheduleStats", () => {
  it("counts gaps longer than a normal break", () => {
    const stats = scheduleStats([
      section("A", "1", ["TUE 13:30-15:10"]),
      section("B", "1", ["TUE 15:20-17:00"]), // 10 min break: not a gap
      section("C", "1", ["TUE 19:00-20:40"]), // 2 h gap
    ]);
    expect(stats).toEqual({ days: 1, gapMinutes: 120, fullSections: 0 });
  });
});
