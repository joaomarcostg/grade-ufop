import { describe, expect, it } from "vitest";

import type { Entry, ProgramBundle } from "./catalog-types";
import { computeEligibility, mostUnlocking, requiredHours } from "./eligibility";

function entry(subjectCode: string, overrides: Partial<Entry> = {}): Entry {
  return {
    subjectCode,
    category: "mandatory",
    track: null,
    period: 1,
    workloadHours: 60,
    extensionHours: 0,
    requirements: [],
    ...overrides,
  };
}

function bundle(entries: Entry[], extra: Partial<ProgramBundle["program"]> = {}): ProgramBundle {
  return {
    institution: { code: "ufop", name: "UFOP" },
    term: { code: "2026/2", syncedAt: null },
    program: {
      code: "SJM",
      name: "Sistemas de Informação",
      degree: null,
      campus: null,
      curriculumVersion: "3",
      requiredHours: { mandatory: 300, total: 400 },
      tracks: [],
      ...extra,
    },
    entries,
    subjects: {},
    sections: [
      {
        id: "s1",
        subjectCode: "CSI412",
        code: "21",
        seats: 0,
        enrolled: 40,
        location: null,
        delivery: null,
        withdrawn: false,
        meetings: [],
        instructors: [],
      },
    ],
  };
}

const CURRICULUM = [
  entry("CSI101"),
  entry("CSI102", { period: 2, requirements: [{ type: "subject", code: "CSI101" }] }),
  entry("CSI412", { period: 4, requirements: [{ type: "subject", code: "CSI102" }] }),
  entry("CSI410", { period: 5, requirements: [{ type: "subject", code: "CSI412" }] }),
  entry("CSI990", { period: 5, workloadHours: 30, requirements: [{ type: "hours", hours: 120 }] }),
  entry("CSI500", { category: "elective", period: null, workloadHours: 60 }),
];

describe("computeEligibility", () => {
  it("classifies entries from the subjects passed", () => {
    const { states, progress } = computeEligibility(bundle(CURRICULUM), new Set(["CSI101", "CSI102"]), null);
    expect(states.get("CSI101")!.status).toBe("done");
    expect(states.get("CSI412")!.status).toBe("available");
    expect(states.get("CSI410")!.missing).toEqual([{ type: "subject", code: "CSI412" }]);
    expect(states.get("CSI990")!.status).toBe("available"); // 120 h reached
    expect(progress.completedHours).toBe(120);
    expect(progress.byCategory.mandatory).toBe(120);
  });

  it("checks hour requirements against completed workload", () => {
    const { states } = computeEligibility(bundle(CURRICULUM), new Set(["CSI101"]), null);
    expect(states.get("CSI990")!.missing).toEqual([{ type: "hours", hours: 120 }]);
  });

  it("knows what is offered and what still has seats", () => {
    const { states } = computeEligibility(bundle(CURRICULUM), new Set(), null);
    expect(states.get("CSI412")!.offered).toBe(true);
    expect(states.get("CSI412")!.openSections).toBe(0);
    expect(states.get("CSI101")!.offered).toBe(false);
  });

  it("ranks what unlocks the most", () => {
    const eligibility = computeEligibility(bundle(CURRICULUM), new Set(["CSI101", "CSI102"]), null);
    expect(mostUnlocking(eligibility).map((s) => s.entry.subjectCode)).toEqual(["CSI412"]);
    expect(eligibility.states.get("CSI412")!.unlocks).toEqual(["CSI410"]);
  });

  it("hides entries of other tracks once a track is chosen", () => {
    const entries = [entry("A"), entry("B", { track: "Biotecnologia" }), entry("C", { track: "Biodiversidade" })];
    const { states } = computeEligibility(bundle(entries), new Set(), "Biotecnologia");
    expect([...states.keys()]).toEqual(["A", "B"]);
  });
});

describe("requiredHours", () => {
  it("picks the track block whose mandatory total matches the rows", () => {
    const entries = [entry("A"), entry("B", { track: "Física Básica" })];
    const b = bundle(entries, {
      tracks: [
        { kind: "habilitação", name: "Física Básica", requiredHours: { mandatory: 999 } },
        { kind: "ênfase", name: "Física Básica", requiredHours: { mandatory: 120 } },
      ],
    });
    expect(requiredHours(b, "Física Básica").mandatory).toBe(120);
    expect(requiredHours(b, null).mandatory).toBe(300);
  });
});
