import type { ProgramBundle } from "../catalog-types";
import { compareTerms, PASSED, type Transcript, type TranscriptRow } from "./parse";

/**
 * Maps the subjects a student passed to their curriculum's subjects.
 *
 * Codes change between curriculum versions (CSI488 "Algoritmos e Estrutura de
 * Dados I" from 2017 is CSI103 "Algoritmos e Estruturas de Dados I" in
 * today's Engenharia de Computação), so a passed subject matches, in order of
 * confidence:
 * 1. the same code in the curriculum;
 * 2. a curriculum subject with the same name once accents, punctuation,
 *    connecting words and plurals are ignored ("Algoritmos e Estrutura de
 *    Dados I" = "Algoritmos e Estruturas de Dados I").
 * Name matches are suggestions the student confirms; anything else is listed
 * for the student to resolve. Equivalence rules are the institution's call,
 * so nothing is matched more loosely than this.
 */

export type MatchKind = "code" | "name";

export interface RowMatch {
  /** The attempt that decides: the one that passed, else the latest. */
  row: TranscriptRow;
  /** Curriculum subject it corresponds to, or null when unresolved. */
  subjectCode: string | null;
  how: MatchKind | null;
}

export interface TranscriptMatch {
  passed: RowMatch[];
  /** Subjects never passed (failed, locked, ongoing). */
  notPassed: RowMatch[];
}

const CONNECTORS = new Set(["A", "AS", "AO", "AOS", "O", "OS", "DE", "DA", "DAS", "DO", "DOS", "E", "EM", "NA", "NAS", "NO", "NOS", "PARA", "COM"]);

/** "Algoritmos e Estruturas de Dados I" -> "ALGORITMO ESTRUTURA DADO I" */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !CONNECTORS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("S") ? w.slice(0, -1) : w))
    .join(" ");
}

export function matchTranscript(transcript: Transcript, bundle: ProgramBundle): TranscriptMatch {
  const inCurriculum = new Set(bundle.entries.map((e) => e.subjectCode));
  const byName = new Map<string, string[]>();
  for (const code of inCurriculum) {
    const key = nameKey(bundle.subjects[code]?.name ?? code);
    byName.set(key, [...(byName.get(key) ?? []), code]);
  }

  // The latest attempt decides; a subject passed once stays passed.
  const latest = new Map<string, TranscriptRow>();
  for (const row of [...transcript.rows].sort((a, b) => compareTerms(a.term, b.term))) {
    const previous = latest.get(row.code);
    if (!previous || !PASSED.has(previous.status)) latest.set(row.code, row);
  }

  const passed: RowMatch[] = [];
  const notPassed: RowMatch[] = [];
  for (const row of latest.values()) {
    let match: RowMatch = { row, subjectCode: null, how: null };
    if (inCurriculum.has(row.code)) match = { row, subjectCode: row.code, how: "code" };
    else {
      const candidates = byName.get(nameKey(row.name)) ?? [];
      if (candidates.length === 1) match = { row, subjectCode: candidates[0], how: "name" };
    }
    (PASSED.has(row.status) ? passed : notPassed).push(match);
  }
  return { passed, notPassed };
}

/**
 * Curriculum subjects the student had passed before ``term`` started, given
 * the confirmed mapping from transcript codes to curriculum codes.
 */
export function passedBefore(
  transcript: { rows: Pick<TranscriptRow, "term" | "code" | "status">[] },
  mapping: Record<string, string>,
  term: string | null,
): string[] {
  const codes = new Set<string>();
  for (const row of transcript.rows) {
    if (!PASSED.has(row.status)) continue;
    if (term && compareTerms(row.term, term) >= 0) continue;
    const code = mapping[row.code];
    if (code) codes.add(code);
  }
  return [...codes].sort();
}
