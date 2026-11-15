import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { Entry, ProgramBundle } from "../catalog-types";
import { linesFromItems } from "./extract";
import { matchTranscript, nameKey, passedBefore } from "./match";
import { parseTranscript, TranscriptFormatError } from "./parse";

// Course table of a real UFOP transcript (Engenharia de Computação, 2017-2025),
// shared by its owner for testing, with every personal field removed.
const LINES: string[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/engenharia-computacao.json", import.meta.url)), "utf8"),
);

describe("parseTranscript", () => {
  const transcript = parseTranscript(LINES);

  it("reads every course row", () => {
    expect(transcript.programName).toBe("ENGENHARIA DE COMPUTACAO");
    expect(transcript.rows).toHaveLength(87);
    expect(transcript.rows[0]).toEqual({
      term: "2017/1",
      code: "CEA001",
      name: "Geometria Analitica e Algebra Linear",
      kind: null,
      workloadHours: 60,
      grade: 6,
      status: "AP",
    });
  });

  it("reads locked rows, elective marks and activities", () => {
    const locked = transcript.rows.find((r) => r.code === "CEA302" && r.term === "2018/2");
    expect(locked).toMatchObject({ status: "TR", grade: null });
    expect(transcript.rows.find((r) => r.code === "CSI705")).toMatchObject({
      name: "Aprendizagem Profunda",
      kind: "elective",
    });
    expect(transcript.rows.find((r) => r.code === "ATV100")).toMatchObject({ workloadHours: 190, status: "AP" });
  });

  it("keeps terms with no rows, like a fully locked semester", () => {
    expect(transcript.terms).toContain("2020/2");
    expect(transcript.terms[0]).toBe("2017/1");
    expect(transcript.terms.at(-1)).toBe("2025/2");
  });

  it("reads the hour summary", () => {
    expect(transcript.hours).toEqual({ mandatory: 3330, elective: 300, total: 3630 });
  });

  it("rejects documents without a course table", () => {
    expect(() => parseTranscript(["Qualquer outro PDF"])).toThrow(TranscriptFormatError);
  });
});

describe("nameKey", () => {
  it("ignores accents, punctuation, connecting words and plurals", () => {
    expect(nameKey("Algoritmos e Estruturas de Dados I")).toBe(nameKey("Algoritmos e Estrutura de Dados I"));
    expect(nameKey("Ciência, Tecnologia e Sociedade")).toBe(nameKey("Ciencia Tecnologia e Sociedade"));
    expect(nameKey("Cálculo I")).not.toBe(nameKey("Cálculo II"));
  });
});

function entry(subjectCode: string): Entry {
  return {
    subjectCode,
    category: "mandatory",
    track: null,
    period: 1,
    workloadHours: 60,
    extensionHours: 0,
    weeklyClasses: 4,
    requirements: [],
  };
}

function bundleOf(subjects: Record<string, string>): ProgramBundle {
  return {
    institution: { code: "ufop", name: "UFOP" },
    term: { code: "2026/2", syncedAt: null },
    program: {
      code: "CJM",
      name: "Engenharia de Computação",
      degree: null,
      campus: null,
      curriculumVersion: "2",
      requiredHours: {},
      tracks: [],
    },
    entries: Object.keys(subjects).map(entry),
    subjects: Object.fromEntries(
      Object.entries(subjects).map(([code, name]) => [code, { code, name, department: null, syllabus: null }]),
    ),
    sections: [],
  };
}

describe("matchTranscript", () => {
  const transcript = parseTranscript([
    "2017/1 CEA001 - Geometria Analitica 60/0 6.0 2/72 AP",
    "2017/1 CSI030 - Programacao de Computadores I 60/0 6.0 5/72 AP",
    "2017/2 CSI488 - Algoritmos e Estrutura de Dados I 60/0 3.7 0/72 RN",
    "2018/2 CSI488 - Algoritmos e Estrutura de Dados I 60/0 7.3 6/72 AP",
    "2018/2 CSI999 - Topicos Especiais 60/0 8.0 0/72 AP",
    "2019/1 CEA302 - Equacoes Diferenciais 60/0 4.6 18/72 RN",
  ]);
  const bundle = bundleOf({
    CEA001: "Geometria Analítica",
    CSI101: "Programação de Computadores I",
    CSI103: "Algoritmos e Estruturas de Dados I",
    CEA302: "Equações Diferenciais",
  });
  const result = matchTranscript(transcript, bundle);
  const byCode = Object.fromEntries(result.passed.map((p) => [p.row.code, p]));

  it("matches by code first, then by name", () => {
    expect(byCode.CEA001).toMatchObject({ subjectCode: "CEA001", how: "code" });
    expect(byCode.CSI030).toMatchObject({ subjectCode: "CSI101", how: "name" });
  });

  it("uses the attempt that passed", () => {
    expect(byCode.CSI488).toMatchObject({ subjectCode: "CSI103", how: "name" });
  });

  it("leaves unknown subjects for the student to resolve", () => {
    expect(byCode.CSI999).toMatchObject({ subjectCode: null, how: null });
  });

  it("lists failed subjects separately", () => {
    expect(result.notPassed.map((r) => [r.row.code, r.subjectCode])).toEqual([["CEA302", "CEA302"]]);
  });

  it("replays what was passed before a term", () => {
    const mapping = { CEA001: "CEA001", CSI030: "CSI101", CSI488: "CSI103" };
    expect(passedBefore(transcript, mapping, "2018/1")).toEqual(["CEA001", "CSI101"]);
    expect(passedBefore(transcript, mapping, null)).toEqual(["CEA001", "CSI101", "CSI103"]);
  });
});

describe("linesFromItems", () => {
  it("groups text by baseline, top to bottom, left to right", () => {
    const item = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y] });
    expect(linesFromItems([item("AP", 500, 700), item("2017/1", 40, 701), item("Outra", 40, 680)])).toEqual([
      "2017/1 AP",
      "Outra",
    ]);
  });
});

const DATASET = fileURLToPath(new URL("../../../../../pipeline/out/ufop-2026-2.json", import.meta.url));

describe.skipIf(!existsSync(DATASET))("the real transcript against the real 2026/2 curriculum", () => {
  it("resolves most passed subjects", () => {
    const data = JSON.parse(readFileSync(DATASET, "utf8"));
    const program = data.programs.find((p: { code: string }) => p.code === "CJM");
    const names: Record<string, string> = {};
    for (const s of data.subjects) names[s.code] = s.display_name ?? s.name;
    const bundle = bundleOf(Object.fromEntries(program.entries.map((e: { subject_code: string }) => [e.subject_code, names[e.subject_code]])));
    const { passed } = matchTranscript(parseTranscript(LINES), bundle);
    const resolved = passed.filter((p) => p.subjectCode);
    expect(passed).toHaveLength(58);
    expect(resolved.length).toBeGreaterThanOrEqual(53);
  });
});
